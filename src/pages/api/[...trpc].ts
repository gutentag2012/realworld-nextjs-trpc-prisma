import { appRouter } from '$/server/api/routers'
import { createTRPCContext } from '$/server/api/trpc'
import type { NextApiRequest, NextApiResponse } from 'next'
import cors from 'nextjs-cors'
import { createOpenApiNextHandler } from 'trpc-openapi'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Setup CORS
  await cors(req, res)

  // Handle incoming OpenAPI requests
  return createOpenApiNextHandler({
    router: appRouter,
    createContext: createTRPCContext,
  })(req, res)
}

export default handler
