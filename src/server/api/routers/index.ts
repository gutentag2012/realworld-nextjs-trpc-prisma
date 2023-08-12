import { articleRouter } from '$/server/api/routers/articles'
import { authenticationRouter } from '$/server/api/routers/authentication'
import { commentsRouter } from '$/server/api/routers/comments'
import { favoritesRouter } from '$/server/api/routers/favorites'
import { profileRouter } from '$/server/api/routers/profile'
import { tagsRouter } from '$/server/api/routers/tags'
import { createTRPCRouter } from '$/server/api/trpc'

export const appRouter = createTRPCRouter({
  articles: articleRouter,
  comments: commentsRouter,
  favorites: favoritesRouter,
  profiles: profileRouter,
  tags: tagsRouter,
  auth: authenticationRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
