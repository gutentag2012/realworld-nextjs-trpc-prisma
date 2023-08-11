import { appRouter } from '$/server/api/routers'
import { generateOpenApiDocument } from 'trpc-openapi'

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Example CRUD API',
  description: 'OpenAPI compliant REST API built using tRPC with Next.js',
  version: '1.0.0',
  baseUrl: 'http://localhost:3000/api',
  docsUrl: 'https://github.com/jlalmes/trpc-openapi',
  tags: ['Articles', 'Comments', 'Favorites', 'Profile', 'Tags', 'User and Authentication'],
})
