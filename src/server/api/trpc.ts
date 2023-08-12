import { env } from '$/env.mjs'
import { prisma } from '$/server/db'
import type { User } from '@prisma/client'
import { type inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server'
import type { CreateNextContextOptions } from '@trpc/server/src/adapters/next'
import { verify } from 'jsonwebtoken'
import superjson from 'superjson'
import type { OpenApiMeta } from 'trpc-openapi'
import { ZodError } from 'zod'

const jwtVerify = <T>(token: string, secret: string) => verify(token, secret) as T

interface CreateContextOptions {
  user: User | null
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    ...opts,
    prisma,
  }
}

const getUserFromToken = (token?: string) => {
  if (!token) return null

  const jwtUser = jwtVerify<{ id?: string }>(token, env.JWT_SECRET)

  if (!jwtUser?.id) return null

  return prisma.user.findUnique({
    where: { id: jwtUser.id },
  })
}

export const createTRPCContext = async ({ req }: CreateNextContextOptions) => {
  const token = req.headers.authorization?.split(' ')[1]
  const user = await getUserFromToken(token)

  return createInnerTRPCContext({ user })
}

type Context = inferAsyncReturnType<typeof createTRPCContext>

const t = initTRPC
  .context<Context>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError
              ? error.cause.flatten(issue => `${issue.path.pop()}: ${issue.message}`)
              : undefined,
        },
      }
    },
  })

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User has no access to this resource',
    })
  }
  return next({
    ctx: {
      ...ctx,
      // infers the `session` as non-nullable
      user: ctx.user,
    },
  })
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = publicProcedure.use(enforceUserIsAuthed)
