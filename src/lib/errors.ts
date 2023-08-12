import { type RouterErrors } from '$/lib/api'
import { type TRPCClientErrorBase } from '@trpc/client'

export const getErrorArrayFromTrpcResponseError = (
  error?: TRPCClientErrorBase<RouterErrors> | null,
  isError = true,
) => {
  if (!error || !isError) {
    return undefined
  }
  if (!error?.data?.zodError?.fieldErrors) {
    return [error.message]
  }
  return Object.entries(error.data.zodError.fieldErrors)
    .flatMap(([key, messages]) =>
      messages?.map(message => (message.startsWith(key) ? message : `${key}.${message}`)),
    )
    .filter(Boolean) as string[]
}
