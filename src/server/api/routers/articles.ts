import { truthy } from '$/lib/types'
import { profileSchema } from '$/server/api/routers/profile'
import { tagsSchema } from '$/server/api/routers/tags'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '$/server/api/trpc'
import { type PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const articleSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  body: z.string().min(1),
  tagList: z
    .array(tagsSchema)
    .nullish()
    .transform((tags): Array<string> => {
      return tags?.map(tag => tag.value) ?? []
    }),
  createdAt: z.date().transform(d => d.toISOString()),
  updatedAt: z.date().transform(d => d.toISOString()),
  favorited: z.boolean(),
  favoritesCount: z.number(),
  author: profileSchema,
})

const paginationInputSchema = z.object({
  offset: z.number().optional(),
  limit: z.number().optional().default(5),
})

const articleListSchema = z.object({
  articles: articleSchema.array(),
  articlesCount: z.number(),
})

async function generateUniqueSlug(title: string, prisma: PrismaClient) {
  const slug = title.toLowerCase().replace(/\s/g, '-')
  const similarSlugCount = await prisma.article.count({
    where: { slug: { startsWith: slug } },
  })
  return `${slug}-${similarSlugCount + 1}`
}

export const articleRouter = createTRPCRouter({
  getArticleFeed: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/articles/feed',
        protect: true,
        tags: ['Articles'],
        summary: 'Get recent articles from users you follow',
        description:
          'Get most recent articles from users you follow. Use query parameters to limit. Auth is required',
      },
    })
    .input(paginationInputSchema)
    .output(articleListSchema)
    .query(async opts => {
      const { input, ctx } = opts

      const skip = Math.max(0, (input.offset ?? 1) - 1) * input.limit
      const where = {
        author: {
          followedByUsers: {
            some: {
              id: ctx.user.id,
            },
          },
        },
      }

      const articles = await ctx.prisma.article.findMany({
        take: input.limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          _count: { select: { favoritedBy: true } },
          favoritedBy: { select: { id: true }, where: { id: ctx.user.id } },
          tagList: { orderBy: { value: 'asc' } },
        },
        where,
      })
      const articlesCount = await ctx.prisma.article.count({ where })

      return {
        articles: articles.map(article => ({
          ...article,
          author: {
            ...article.author,
            following: true, // We know that the user follows the author since it is his feed
          },
          favorited: article.favoritedBy.length > 0,
          favoritesCount: article._count.favoritedBy,
        })),
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
        description:
          'Get most recent articles globally. Use query parameters to filter results. Auth is optional',
      },
    })
    .input(
      paginationInputSchema.extend({
        tag: z.string().optional(),
        author: z.string().optional(),
        favorited: z.string().optional(),
      }),
    )
    .output(articleListSchema)
    .query(async opts => {
      const { input, ctx } = opts

      const skip = Math.max(0, (input.offset ?? 1) - 1) * input.limit
      const where = {
        AND: [
          input.tag && { tagList: { some: { value: { contains: input.tag } } } },
          input.author && { author: { username: input.author } },
          input.favorited && { favoritedBy: { some: { username: input.favorited } } },
        ].filter(truthy),
      }

      const articles = await ctx.prisma.article.findMany({
        take: input.limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            include: {
              followedByUsers: {
                select: { id: true },
                where: { id: ctx.user?.id },
              },
            },
          },
          tagList: { orderBy: { value: 'asc' } },
          _count: { select: { favoritedBy: true } },
          favoritedBy: { select: { id: true }, where: { id: ctx.user?.id } },
        },
        where,
      })
      const articlesCount = await ctx.prisma.article.count({ where })

      return {
        articles: articles.map(article => ({
          ...article,
          author: {
            ...article.author,
            following: article.author.followedByUsers.length > 0,
          },
          favorited: article.favoritedBy.length > 0,
          favoritesCount: article._count.favoritedBy,
        })),
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
    .input(
      z.object({
        article: articleSchema
          .pick({ title: true, description: true, body: true })
          .extend({ tagList: z.string().array() }),
      }),
    )
    .output(z.object({ article: articleSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const createdAt = new Date()
      const slug = await generateUniqueSlug(input.article.title, ctx.prisma)

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
          slug,
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
            following: false, // Since this is the user itself, he is not following himself
          },
          favorited: false, // Since the article was just created, the user has not favorited it yet
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
    .input(z.object({ slug: z.string().min(1) }))
    .output(z.object({ article: articleSchema }))
    .query(async opts => {
      const { input, ctx } = opts

      const article = await ctx.prisma.article.findUnique({
        include: {
          author: {
            include: {
              followedByUsers: {
                select: { id: true },
                where: { id: ctx.user?.id },
              },
            },
          },
          tagList: { orderBy: { value: 'asc' } },
          _count: { select: { favoritedBy: true } },
          favoritedBy: { select: { id: true }, where: { id: ctx.user?.id } },
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

      return {
        article: {
          ...article,
          author: {
            ...article.author,
            following: article.author.followedByUsers.length > 0,
          },
          favorited: article.favoritedBy.length > 0,
          favoritesCount: article._count.favoritedBy,
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
    .input(
      z.object({
        slug: z.string().min(1),
        article: articleSchema.pick({ title: true, description: true, body: true }).partial(),
      }),
    )
    .output(z.object({ article: articleSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const updatedAt = new Date()
      let slug = input.slug
      if (input.article.title) {
        slug = await generateUniqueSlug(input.article.title, ctx.prisma)
      }

      const article = await ctx.prisma.article.update({
        where: { slug: input.slug },
        data: {
          title: input.article.title || undefined,
          description: input.article.description || undefined,
          body: input.article.body || undefined,
          slug,
          updatedAt,
        },
        include: {
          author: {
            include: {
              followedByUsers: {
                select: { id: true },
                where: { id: ctx.user.id },
              },
            },
          },
          _count: { select: { favoritedBy: true } },
          favoritedBy: { select: { id: true }, where: { id: ctx.user.id } },
          tagList: { orderBy: { value: 'asc' } },
        },
      })

      return {
        article: {
          ...article,
          author: {
            ...article.author,
            following: article.author.followedByUsers.length > 0,
          },
          favorited: article.favoritedBy.length > 0,
          favoritesCount: article._count.favoritedBy,
        },
      }
    }),
  deleteArticle: protectedProcedure
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
    .input(z.object({ slug: z.string().min(1) }))
    .output(z.void())
    .mutation(async opts => {
      const { input, ctx } = opts

      await ctx.prisma.article.delete({
        where: { slug: input.slug },
      })
    }),
})
