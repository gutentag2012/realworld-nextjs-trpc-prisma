import { QueryLink } from '$/components/util/QueryLink'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { type FC, useEffect, useMemo } from 'react'

export const usePagination = (pageSize = 5) => {
  const searchParams = useSearchParams()

  const [limit, offset] = useMemo(() => {
    const limit = parseInt(searchParams.get('limit') ?? pageSize.toString())
    const offset = parseInt(searchParams.get('offset') ?? (1).toString())
    return [limit, offset]
  }, [pageSize, searchParams])

  return { limit, offset }
}

interface PaginationProps {
  totalCount?: number
  currentCount?: number
  limit: number
  offset: number
}

export const Pagination: FC<PaginationProps> = ({ totalCount, currentCount, limit, offset }) => {
  const { pathname, query: currentQuery, push } = useRouter()

  const pagination = useMemo<Array<number | '...'>>(() => {
    if (!totalCount) {
      return []
    }

    const pageCount = Math.ceil(totalCount / limit)
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    }

    if (offset <= 2) {
      return [1, 2, 3, '...', pageCount]
    }
    if (offset > pageCount - 2) {
      return [1, '...', pageCount - 2, pageCount - 1, pageCount]
    }

    return [
      1,
      offset > 3 && '...',
      offset - 1,
      offset,
      offset + 1,
      offset < pageCount - 2 && '...',
      pageCount,
    ].filter(Boolean) as Array<number | '...'>
  }, [totalCount, limit, offset])

  // This is used to go back a page in case the current page is empty because of a filter change
  useEffect(() => {
    // If there are articles on the page or if the offset is already at the start, do nothing
    if (currentCount !== 0 || offset <= 1) {
      return
    }
    const finalQuery = { ...currentQuery, offset: offset - 1 }
    push({ pathname, query: finalQuery }).catch(console.error)
  }, [currentCount, currentQuery, offset, pathname, push])

  return (
    <ul className="pagination">
      {pagination.map(page => (
        <li key={page} className={`page-item ${page === offset ? 'active' : ''}`}>
          {page === '...' ? (
            <span className="page-link" style={{ pointerEvents: 'none' }}>
              ...
            </span>
          ) : (
            <QueryLink
              className={`page-link${page === offset ? ' active' : ''}`}
              query={{ offset: page.toString() }}
            >
              {page}
            </QueryLink>
          )}
        </li>
      ))}
    </ul>
  )
}
