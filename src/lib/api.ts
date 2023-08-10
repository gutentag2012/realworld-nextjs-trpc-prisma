"use client";

/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */
import type { AppRouter } from '$/server/api/routers'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import { type inferRouterInputs, type inferRouterOutputs, inferRouterError } from '@trpc/server'
import { useEffect, useState } from 'react'
import superjson from 'superjson'

// TODO Not a good idea to store token in session storage
export const setToken = (newToken: string | null) => {
  if (typeof window === 'undefined') { return }
  window.sessionStorage.setItem('token', newToken ?? '')
}

export const useIsLoggedIn = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const newToken = (typeof window === 'undefined' ? null : window.sessionStorage.getItem('token')) ?? null
    setIsLoggedIn(!!newToken)
  }, [])

  return isLoggedIn
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return ''
  } // browser should use relative url
  if (process.env.VERCEL_URL) {
    return `https://${ process.env.VERCEL_URL }`
  } // SSR should use vercel url
  return `http://localhost:${ process.env.PORT ?? 3000 }` // dev SSR should use localhost
}

/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      /**
       * Transformer used for data de-serialization from the server.
       *
       * @see https://trpc.io/docs/data-transformers
       */
      transformer: superjson,

      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${ getBaseUrl() }/api/trpc`,
          headers() {
            const token = (typeof window === 'undefined' ? null : window.sessionStorage.getItem('token')) ?? null
            return {
              ...(token ? { Authorization: `Token ${ token }` } : {}),
            }
          },
        }),
      ],
    }
  },
  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
})

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

export type RouterErrors = inferRouterError<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
