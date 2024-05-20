import { createTRPCRouter, protectedProcedure, publicProcedure } from '$/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const profileSchema = z.object({
  username: z.string().min(1),
  bio: z.string().nullish(),
  image: z.string().url().nullish(),
  following: z.boolean().optional().default(false),
})

export const profileRouter = createTRPCRouter({
  getProfileByName: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/profiles/{username}',
        protect: true, // Usually this should be false, but swagger does not send the auth header without
        tags: ['Profile'],
        summary: 'Get a profile',
        description: 'Get a profile of a user of the system. Auth is optional',
      },
    })
    .input(profileSchema.pick({ username: true }))
    .output(z.object({ profile: profileSchema }))
    .query(async opts => {
      const { input, ctx } = opts

      const profile = await ctx.prisma.user.findUnique({
        where: { username: input.username },
        include: {
          followedByUsers: {
            select: { id: true },
            where: { id: ctx.user?.id },
          },
        },
      })

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        })
      }

      return {
        profile: {
          ...profile,
          following: profile.followedByUsers.length > 0,
        },
      }
    }),
  followProfile: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/profiles/{username}/follow',
        protect: true,
        tags: ['Profile'],
        summary: 'Follow a user',
        description: 'Follow a user by username',
      },
    })
    .input(profileSchema.pick({ username: true }))
    .output(z.object({ profile: profileSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const profile = await ctx.prisma.user.update({
        where: { username: input.username },
        data: {
          followedByUsers: {
            connect: {
              id: ctx.user.id,
            },
          },
        },
      })

      return {
        profile: {
          ...profile,
          following: true,
        },
      }
    }),
  unFollowProfile: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/profiles/{username}/follow',
        protect: true,
        tags: ['Profile'],
        summary: 'Unfollow a user',
        description: 'Unfollow a user by username',
      },
    })
    .input(profileSchema.pick({ username: true }))
    .output(z.object({ profile: profileSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const profile = await ctx.prisma.user.update({
        where: { username: input.username },
        data: {
          followedByUsers: {
            disconnect: {
              id: ctx.user.id,
            },
          },
        },
      })

      return {
        profile: {
          ...profile,
          following: false,
        },
      }
    }),
})
