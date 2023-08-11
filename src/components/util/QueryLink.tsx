import { type LinkProps } from 'next/dist/client/link'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { type FunctionComponent } from 'react'

interface QueryLinkProps extends Omit<LinkProps, 'href'> {
  query: Record<string, string | undefined>
  children: React.ReactNode
  className: string
}

type Props = QueryLinkProps

export const QueryLink: FunctionComponent<Props> = ({ query, children, ...props }) => {
  const { pathname, query: currentQuery } = useRouter()

  const finalQuery = { ...currentQuery, ...query }

  return (
    <Link href={{ pathname, query: finalQuery }} {...props}>
      {children}
    </Link>
  )
}
