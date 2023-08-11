/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

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

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

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
    user: opts.user,
    prisma,
  }
}

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async ({ req }: CreateNextContextOptions) => {
  let user: User | null = null

  if (!req.headers.authorization) {
    return createInnerTRPCContext({ user })
  }
  const token = req.headers.authorization.split(' ')[1]
  const jwtUser = jwtVerify<{ id?: string }>(token ?? '', env.JWT_SECRET)

  if (!jwtUser?.id) {
    return createInnerTRPCContext({ user })
  }

  user = await prisma.user.findUnique({
    where: { id: jwtUser.id },
  })

  return createInnerTRPCContext({ user })
}

type Context = inferAsyncReturnType<typeof createTRPCContext>

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
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

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/** Reusable middleware that enforces users are logged in before running the procedure. */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'User has no access to this resource' })
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
