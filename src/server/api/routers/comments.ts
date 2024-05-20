import { profileSchema } from '$/server/api/routers/profile'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '$/server/api/trpc'
import { z } from 'zod'

const commentSchema = z.object({
  id: z.number(),
  createdAt: z.date().transform(d => d.toISOString()),
  updatedAt: z.date().transform(d => d.toISOString()),
  body: z.string().min(1),
  author: profileSchema,
})

export const commentsRouter = createTRPCRouter({
  getCommentsForArticle: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/articles/{slug}/comments',
        protect: false,
        tags: ['Comments'],
        summary: 'Get comments for an article',
        description: 'Get the comments for an article. Auth is optional',
      },
    })
    .input(z.object({ slug: z.string().min(1) }))
    .output(z.object({ comments: commentSchema.array() }))
    .query(async opts => {
      const { input, ctx } = opts

      const comments = await ctx.prisma.comment.findMany({
        where: { article: { slug: input.slug } },
        include: { author: true },
      })

      return { comments }
    }),
  addCommentToArticle: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/articles/{slug}/comments',
        protect: true,
        tags: ['Comments'],
        summary: 'Create a comment for an article',
        description: 'Create a comment for an article. Auth is required',
      },
    })
    .input(
      z.object({
        slug: z.string().min(1),
        comment: commentSchema.pick({ body: true }),
      }),
    )
    .output(z.object({ comment: commentSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const createdAt = new Date()
      const comment = await ctx.prisma.comment.create({
        data: {
          body: input.comment.body,
          article: { connect: { slug: input.slug } },
          author: { connect: { id: ctx.user.id } },
          createdAt,
          updatedAt: createdAt,
        },
        include: { author: true },
      })

      return { comment }
    }),
  removeCommentFromArticle: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/articles/{slug}/comments/{id}',
        protect: true,
        tags: ['Comments'],
        summary: 'Delete a comment for an article',
        description: 'Delete a comment for an article. Auth is required',
      },
    })
    .input(
      z.object({
        slug: z.string().min(1),
        id: z.number(),
      }),
    )
    .output(z.void())
    .mutation(async opts => {
      const { input, ctx } = opts

      await ctx.prisma.comment.delete({
        where: {
          id: input.id,
          article: { slug: input.slug },
        },
      })
    }),
})
