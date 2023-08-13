import { env } from '$/env.mjs'
import { truthy } from '$/lib/types'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '$/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { compare, hash } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { z } from 'zod'

export const userSchema = z.object({
  email: z.string().email(),
  username: z.string().nonempty(),
  token: z.string().nonempty(),
  bio: z.string().nonempty().nullish(),
  image: z.string().url().nullish(),
})
const userSchemaWithPassword = userSchema.extend({ password: z.string().min(8) })

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
    .input(
      z.object({
        user: userSchemaWithPassword.pick({ email: true, password: true }),
      }),
    )
    .output(z.object({ user: userSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const user = await ctx.prisma.user.findUnique({
        where: { email: input.user.email },
      })

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Password did not match',
        })
      }

      const passwordMatch = await compare(input.user.password, user.passwordHash)
      if (!passwordMatch) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Password did not match',
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
    .input(
      z.object({
        user: userSchemaWithPassword.pick({ username: true, email: true, password: true }),
      }),
    )
    .output(z.object({ user: userSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const existingUser = await ctx.prisma.user.findFirst({
        where: { OR: [{ email: input.user.email }, { username: input.user.username }] },
      })

      if (!!existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User already exists',
        })
      }

      const passwordHash = await hash(input.user.password, 10)
      const user = await ctx.prisma.user.create({
        data: {
          username: input.user.username,
          email: input.user.email,
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
    .input(userSchemaWithPassword.partial())
    .output(z.object({ user: userSchema }))
    .mutation(async opts => {
      const { input, ctx } = opts

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
      })

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        })
      }

      // Check if another user already has the proposed email or username
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
          code: 'BAD_REQUEST',
          message: 'User already exists',
        })
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          username: input.username,
          email: input.email,
          bio: input.bio,
          passwordHash: input.password && (await hash(input.password, 10)),
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
