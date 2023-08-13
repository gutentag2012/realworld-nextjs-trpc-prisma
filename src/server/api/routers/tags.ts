import { createTRPCRouter, publicProcedure } from '$/server/api/trpc'
import { z } from 'zod'

export const tagsSchema = z.object({
  value: z.string(),
})

export const tagsRouter = createTRPCRouter({
  getUniqueTags: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/tags',
        protect: false,
        tags: ['Tags'],
        summary: 'Get tags',
        description: 'Get tags. Auth not required',
      },
    })
    .input(z.void())
    .output(z.object({ tags: z.string().array() }))
    .query(async ({ ctx }) => {
      const tags = await ctx.prisma.articelTags.findMany()
      return {
        tags: tags.map(tag => tag.value),
      }
    }),
})
