import { articleSchema } from '$/server/api/routers/articles'
import { createTRPCRouter, protectedProcedure } from '$/server/api/trpc'
import { z } from 'zod'

export const favoritesRouter = createTRPCRouter({
  addArticleAsFavorite: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/articles/{slug}/favorite',
        protect: true,
        tags: ['Favorites'],
        summary: 'Favorites an article',
        description: 'Favorites an article. Auth is required',
      },
    })
    .input(z.object({ slug: z.string().min(1) }))
    .output(z.object({ article: articleSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const article = await ctx.prisma.article.update({
        where: { slug: input.slug },
        data: {
          favoritedBy: { connect: { id: ctx.user.id } },
        },
        include: { author: true, _count: { select: { favoritedBy: true } } },
      })

      return {
        article: {
          ...article,
          favorited: true,
          favoritesCount: article._count.favoritedBy,
        },
      }
    }),
  removeArticleFromFavorite: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/articles/{slug}/favorite',
        protect: true,
        tags: ['Favorites'],
        summary: 'Unfavorite an article',
        description: 'Unfavorite an article. Auth is required',
      },
    })
    .input(z.object({ slug: z.string().min(1) }))
    .output(z.object({ article: articleSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const article = await ctx.prisma.article.update({
        where: { slug: input.slug },
        data: {
          favoritedBy: { disconnect: { id: ctx.user.id } },
        },
        include: { author: true, _count: { select: { favoritedBy: true } } },
      })

      return {
        article: {
          ...article,
          favorited: false,
          favoritesCount: article._count.favoritedBy,
        },
      }
    }),
})
