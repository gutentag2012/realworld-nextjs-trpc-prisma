import ArticleListEntry from '$/components/article/ArticleListEntry'
import { QueryLink } from '$/components/util/QueryLink'
import { api, useIsLoggedIn } from '$/lib/api'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { type FunctionComponent, useEffect, useMemo } from 'react'

const pageSize = 5
const ArticleTypes = {
  feed: 'Your Feed',
  global: 'Global Feed',
  personal: 'My Articles',
  favourite: 'Favorited Articles',
}

type HashTagArticleType = `#${ string }`
type PredefinedArticleType = keyof typeof ArticleTypes
type ArticleType = PredefinedArticleType | HashTagArticleType

interface ArticleListTabsProps {
  tabs: Array<ArticleType | false>
  defaultTab: ArticleType
  username?: string
  className?: string
  toggleClassName?: string
}

type Props = ArticleListTabsProps

export const ArticleListTabs: FunctionComponent<Props> = ({ tabs, defaultTab, username, className, toggleClassName }) => {
  const searchParams = useSearchParams()
  const isLoggedIn = useIsLoggedIn()
  const { pathname, query: currentQuery, push } = useRouter()

  const [selectedFeedType, limit, offset, isTagSelected] = useMemo(() => {
    const selectedFeedType = searchParams.get('feedType') ?? defaultTab
    const limit = parseInt(searchParams.get('limit') ?? pageSize.toString())
    const offset = parseInt(searchParams.get('offset') ?? (1).toString())
    const isTagSelected = selectedFeedType.startsWith('#')
    return [selectedFeedType, limit, offset, isTagSelected]
  }, [defaultTab, searchParams])

  const finalTags = useMemo(() => [...tabs, isTagSelected && selectedFeedType], [isTagSelected, selectedFeedType, tabs])

  const { data: allArticles, isLoading: isLoadingAllArticles, refetch: refetchAll } = api.articles.getArticles
    .useQuery(
      {
        limit,
        offset,
        tag: isTagSelected ? selectedFeedType.replace('#', '') : undefined,
        favorited: selectedFeedType === 'favourite' ? username : undefined,
        author: selectedFeedType === 'personal' ? username : undefined,
      },
      { enabled: selectedFeedType !== 'feed' },
    )
  const { data: feedArticles, isLoading: isLoadingFeedArticles, refetch: refetchFeed } = api.articles.getArticleFeed
    .useQuery(
      { limit, offset },
      { enabled: selectedFeedType === 'feed' && !!isLoggedIn },
    )

  const { articles, isLoadingArticles, refetch } = useMemo(
    () => {
      return {
        articles: selectedFeedType !== 'feed' ? allArticles : feedArticles,
        isLoadingArticles: selectedFeedType !== 'feed' ? isLoadingAllArticles : isLoadingFeedArticles,
        refetch: selectedFeedType === 'feed' ? refetchFeed : refetchAll,
      }
    },
    [selectedFeedType, allArticles, feedArticles, isLoadingAllArticles, isLoadingFeedArticles, refetchFeed, refetchAll],
  )

  const articlePagination = useMemo<Array<number | '...'>>(() => {
    if (!articles?.articlesCount) {
      return []
    }

    const pageCount = Math.ceil(articles.articlesCount / limit)
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    }

    if (offset <= 2) {
      return [1, 2, 3, '...', pageCount]
    }
    if (offset > pageCount - 2) {
      return [1, '...', pageCount - 2, pageCount - 1, pageCount]
    }

    return [1, offset > 3 && '...', offset - 1, offset, offset + 1, offset < pageCount - 2 && '...', pageCount]
      .filter(Boolean) as Array<number | '...'>
  }, [articles, limit, offset])

  // This is used to go back a page in case the current page is empty because of a filter change
  useEffect(() => {
    if (!articles?.articles || !!articles.articles.length || offset <= 1) {
      return
    }

    const finalQuery = { ...currentQuery, offset: offset - 1 }
    push({ pathname, query: finalQuery })
      .catch(console.error)
  }, [articles, currentQuery, offset, pathname, push])

  return <div className={ className }>
    <div className={ toggleClassName }>
      <ul className='nav nav-pills outline-active'>
        {
          (finalTags.filter(Boolean) as Array<ArticleType>).map((feedType) => <li
            key={ feedType }
            className='nav-item'
            data-testid={ `feed-type-${ feedType }` }
          >
            <QueryLink
              className={ `nav-link ${ feedType === selectedFeedType ? 'active' : '' }` }
              query={ { feedType } }
            >
              { ArticleTypes[feedType as PredefinedArticleType] ?? feedType }
            </QueryLink>
          </li>)
        }
      </ul>
    </div>

    {
      !isLoadingArticles && !articles?.articles?.length &&
        <div className='article-preview'>No articles are here... yet.</div>
    }
    {
      isLoadingArticles ? <div>Loading...</div> : articles?.articles?.map(article => <ArticleListEntry
          key={ article.slug }
          article={ article }
          onToggleFavorite={ () => refetch() }
        />,
      )
    }

    <ul className='pagination'>
      {
        articlePagination.map(page => <li
          key={ page }
          className={ `page-item ${ page === offset ? 'active' : '' }` }
        >
          {
            page === '...'
            ? <span
              className='page-link'
              style={ { pointerEvents: 'none' } }
            >...</span>
            : <QueryLink
              className={ 'page-link' + (page === offset ? ' active' : '') }
              query={ { offset: page.toString() } }
            >
              { page }
            </QueryLink>
          }
        </li>)
      }
    </ul>
  </div>
}
