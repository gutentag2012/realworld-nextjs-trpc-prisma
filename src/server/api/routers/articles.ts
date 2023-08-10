/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { truthy } from '$/lib/types'
import { profileSchema } from '$/server/api/routers/profile'
import { tagsSchema } from '$/server/api/routers/tags'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '$/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

// Define the schema for the article object
export const articleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.string(),
  tagList: z.array(tagsSchema)
    .nullish()
    .transform((tags): Array<string> => {
      return tags?.map(tag => tag.value) ?? []
    }),
  createdAt: z.date()
    .transform(d => d.toISOString()),
  updatedAt: z.date()
    .transform(d => d.toISOString()),
  favorited: z.boolean(),
  favoritesCount: z.number(),
  author: profileSchema,
})

const paginationInputSchema = z.object({
  offset: z.number()
    .optional(),
  limit: z.number()
    .optional()
    .default(5),
})

export const articleRouter = createTRPCRouter({
  getArticleFeed: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/articles/feed',
        protect: true,
        tags: ['Articles'],
        summary: 'Get recent articles from users you follow',
        description: 'Get most recent articles from users you follow. Use query parameters to limit. Auth is required',
      },
    })
    .input(paginationInputSchema)
    .output(z.object({
      articles: z.array(articleSchema),
      articlesCount: z.number(),
    }))
    .query(async ({
                    input,
                    ctx,
                  }) => {
      const where = {
        author: {
          followedByUsers: {
            some: {
              id: ctx.user.id,
            },
          },
        },
      }

      const skip = Math.max(0, ((input.offset ?? 1) - 1)) * input.limit
      const articles = await ctx.prisma.article.findMany({
        take: input.limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { include: { followedByUsers: true } },
          favoritedBy: { select: { id: true } },
          tagList: { orderBy: { value: 'asc' } },
        },
        where,
      })
      const articlesCount = await ctx.prisma.article.count({ where })

      return {
        articles: articles.map((article) => {
          return {
            ...article,
            author: {
              ...article.author,
              following: true,
            },
            favorited: article.favoritedBy.some(user => user.id === ctx.user.id),
            favoritesCount: article.favoritedBy.length,
          }
        }),
        articlesCount,
      }
    }),
  getArticles: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/articles',
        protect: false,
        tags: ['Articles'],
        summary: 'Get recent articles globally',
        description: 'Get most recent articles globally. Use query parameters to filter results. Auth is optional',
      },
    })
    .input(paginationInputSchema.extend({
      tag: z.string()
        .optional(),
      author: z.string()
        .optional(),
      favorited: z.string()
        .optional(),
    }))
    .output(z.object({
      articles: z.array(articleSchema),
      articlesCount: z.number(),
    }))
    .query(async ({
                    input,
                    ctx,
                  }) => {
      const where = {
        AND: [
          input.tag && { tagList: { some: { value: { contains: input.tag } } } },
          input.author && { author: { username: input.author } },
          input.favorited && { favoritedBy: { some: { username: input.favorited } } },
        ].filter(truthy),
      }

      const authorInclude = ctx.user ? {
        include: {
          followedByUsers: {
            select: { id: true },
            where: { id: ctx.user.id },
          },
        },
      } : true

      const skip = Math.max(0, ((input.offset ?? 1) - 1)) * input.limit
      const articles = await ctx.prisma.article.findMany({
        take: input.limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          author: authorInclude,
          tagList: { orderBy: { value: 'asc' } },
          favoritedBy: { select: { id: true } },
        },
        where,
      })
      const articlesCount = await ctx.prisma.article.count({ where })

      return {
        articles: articles.map((article) => {
          const following = 'followedByUsers' in article.author
            && Array.isArray(article.author.followedByUsers)
            && !!article.author.followedByUsers?.length
          return {
            ...article,
            author: {
              ...article.author,
              following,
            },
            favorited: article.favoritedBy.some(user => user.id === ctx.user?.id),
            favoritesCount: article.favoritedBy.length,
          }
        }),
        articlesCount,
      }
    }),
  createArticle: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/articles',
        protect: true,
        tags: ['Articles'],
        summary: 'Create an article',
        description: 'Create an article. Auth is required',
      },
    })
    .input(z.object({
      article: z.object({
        title: z.string()
          .min(1),
        description: z.string()
          .min(1),
        body: z.string()
          .min(1),
        tagList: z.array(z.string()),
      }),
    }))
    .output(z.object({ article: articleSchema }))
    .mutation(async ({
                       input,
                       ctx,
                     }) => {
      const createdAt = new Date()

      const slug = input.article.title.toLowerCase()
        .replace(/\s/g, '-')
      const similarSlugCount = await ctx.prisma.article.count({
        where: { slug: { startsWith: slug } },
      })

      const article = await ctx.prisma.article.create({
        data: {
          ...input.article,
          tagList: {
            connectOrCreate: input.article.tagList.map(tag => ({
              where: { value: tag },
              create: { value: tag },
            })),
          },
          createdAt,
          updatedAt: createdAt,
          slug: `${ slug }-${ similarSlugCount + 1 }`,
          author: { connect: { id: ctx.user.id } },
        },
        include: {
          author: true,
          tagList: { orderBy: { value: 'asc' } },
        },
      })

      return {
        article: {
          ...article,
          author: {
            ...article.author,
            following: false,
          },
          favorited: false,
          favoritesCount: 0,
        },
      }
    }),
  getArticlesBySlug: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/articles/{slug}',
        protect: true, // Usually this should be false, but swagger does not send the auth header without
        tags: ['Articles'],
        summary: 'Get an article',
        description: 'Get an article. Auth not required',
      },
    })
    .input(z.object({ slug: z.string() }))
    .output(z.object({ article: articleSchema }))
    .query(async ({
                    input,
                    ctx,
                  }) => {

      const authorInclude = ctx.user ? {
        include: {
          followedByUsers: {
            select: { id: true },
            where: { id: ctx.user.id },
          },
        },
      } : true

      const article = await ctx.prisma.article.findUnique({
        include: {
          author: authorInclude,
          tagList: { orderBy: { value: 'asc' } },
          favoritedBy: { select: { id: true } },
        },
        where: {
          slug: input.slug,
        },
      })

      if (!article) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Article not found',
        })
      }

      const following = 'followedByUsers' in article.author
        && Array.isArray(article.author.followedByUsers)
        && !!article.author.followedByUsers?.length
      return {
        article: {
          ...article,
          author: {
            ...article.author,
            following,
          },
          favorited: !!ctx.user && article.favoritedBy.some(user => user.id === ctx.user?.id),
          favoritesCount: article.favoritedBy.length,
        },
      }
    }),
  updateArticle: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/articles/{slug}',
        protect: true,
        tags: ['Articles'],
        summary: 'Update an article',
        description: 'Update an article. Auth is required',
      },
    })
    .input(z.object({
      slug: z.string(),
      article: z.object({
        title: z.string().nullish().optional(),
        description: z.string().nullish().optional(),
        body: z.string().nullish().optional(),
      }),
    }))
    .output(z.object({ article: articleSchema }))
    .mutation(async ({
                       input,
                       ctx,
                     }) => {
      const updatedAt = new Date()

      let newSlug = input.slug
      if (input.article.title) {
        const slug = input.article.title.toLowerCase()
          .replace(/\s/g, '-')
        const similarSlugCount = await ctx.prisma.article.count({
          where: { slug: { startsWith: slug } },
        })

        newSlug = `${ slug }-${ similarSlugCount + 1 }`
      }

      const authorInclude = ctx.user ? {
        include: {
          followedByUsers: {
            select: { id: true },
            where: { id: ctx.user.id },
          },
        },
      } : true
      const article = await ctx.prisma.article.update({
        where: { slug: input.slug },
        data: {
          title: input.article.title || undefined,
          description: input.article.description || undefined,
          body: input.article.body || undefined,
          slug: newSlug,
          updatedAt,
        },
        include: {
          author: authorInclude,
          favoritedBy: { select: { id: true } },
          tagList: { orderBy: { value: 'asc' } },
        },
      })

      const following = 'followedByUsers' in article.author
        && Array.isArray(article.author.followedByUsers)
        && !!article.author.followedByUsers?.length
      return {
        article: {
          ...article,
          author: {
            ...article.author,
            following,
          },
          favorited: article.favoritedBy.some(user => user.id === ctx.user.id),
          favoritesCount: article.favoritedBy.length,
        },
      }
    }),
  deleteArticle:
    protectedProcedure
      .meta({
        openapi: {
          method: 'DELETE',
          path: '/articles/{slug}',
          protect: true,
          tags: ['Articles'],
          summary: 'Delete an article',
          description: 'Delete an article. Auth is required',
        },
      })
      .input(z.object({
        slug: z.string(),
      }))
      .output(z.void())
      .mutation(async ({
                         input,
                         ctx,
                       }) => {
        await ctx.prisma.article.delete({
          where: { slug: input.slug },
        })
      }),
})
