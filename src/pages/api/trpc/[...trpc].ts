import { appRouter } from '$/server/api/routers'
import { createNextApiHandler } from '@trpc/server/adapters/next'
import { createTRPCContext } from '$/server/api/trpc'

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
})
