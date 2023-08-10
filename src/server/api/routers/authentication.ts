/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { env } from '$/env.mjs'
import { truthy } from '$/lib/types'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '$/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { compare, hash } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { z } from 'zod'

export const userSchema = z.object({
  email: z.string(),
  token: z.string(),
  username: z.string(),
  bio: z.string()
    .nullish(),
  image: z.string()
    .url()
    .nullish(),
})
export const userUpdateSchema = z.object({
  email: z.string()
    .min(1)
    .optional(),
  username: z.string()
    .min(1)
    .optional(),
  password: z.string()
    .optional(),
  bio: z.string()
    .nullish()
    .optional(),
  image: z.string()
    .url()
    .nullish()
    .optional()
    .or(z.string()
      .max(0)),
})

export const authenticationRouter = createTRPCRouter({
  login: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/users/login',
        protect: false,
        tags: ['User and Authentication'],
        summary: 'Existing user login',
        description: 'Login for existing user',
      },
    })
    .input(z.object({
      user: z.object({
        email: z.string()
          .min(1),
        password: z.string()
          .min(1),
      }),
    }))
    .output(z.object({ user: userSchema }))
    .mutation(async ({
                       input: { user: input },
                       ctx,
                     }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      })
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Password not match',
        })
      }

      const passwordMatch = await compare(input.password, user.passwordHash)
      if (!passwordMatch) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Password not match',
        })
      }

      const token = sign({ id: user.id }, env.JWT_SECRET)
      return {
        user: {
          ...user,
          token,
        },
      }
    }),
  register: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/users',
        protect: false,
        tags: ['User and Authentication'],
        summary: 'Register a new user',
        description: 'Register a new user',
      },
    })
    .input(z.object({
      user: z.object({
        username: z.string(),
        email: z.string(),
        password: z.string(),
      }),
    }))
    .output(z.object({ user: userSchema }))
    .mutation(async ({
                       input: { user: input },
                       ctx,
                     }) => {
      const existingUser = await ctx.prisma.user.findFirst({
        where: { OR: [{ email: input.email }, { username: input.username }] },
      })
      if (!!existingUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User already exists',
        })
      }

      const passwordHash = await hash(input.password, 10)
      const user = await ctx.prisma.user.create({
        data: {
          username: input.username,
          email: input.email,
          passwordHash,
          image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
        },
      })

      const token = sign({ id: user.id }, env.JWT_SECRET)
      return {
        user: {
          ...user,
          token,
        },
      }
    }),
  me: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/user',
        protect: true,
        tags: ['User and Authentication'],
        summary: 'Get current user',
        description: 'Gets the currently logged-in user',
      },
    })
    .input(z.void())
    .output(z.object({ user: userSchema }))
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
      })
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        })
      }

      const token = sign({ id: user.id }, env.JWT_SECRET)
      return {
        user: {
          ...user,
          token,
        },
      }
    }),
  updateUser: protectedProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/user',
        protect: true,
        tags: ['User and Authentication'],
        summary: 'Update current user',
        description: 'Updated user information for current user',
      },
    })
    .input(userUpdateSchema)
    .output(z.object({ user: userSchema }))
    .mutation(async ({
                       input,
                       ctx,
                     }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
      })
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        })
      }

      const userWithSameNameOrEmail = await ctx.prisma.user.findFirst({
        where: {
          OR: [
            input.email && { email: input.email },
            input.username && { username: input.username },
          ].filter(truthy),
          NOT: { id: ctx.user.id },
        },
      })
      if (!!userWithSameNameOrEmail) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User already exists',
        })
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          username: input.username || undefined,
          email: input.email || undefined,
          bio: input.bio,
          passwordHash: input.password ? await hash(input.password, 10) : undefined,
          image: input.image || null,
        },
      })

      const token = sign({ id: updatedUser.id }, env.JWT_SECRET)
      return {
        user: {
          ...updatedUser,
          token,
        },
      }
    }),
})
