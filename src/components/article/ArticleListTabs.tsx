import ArticleListEntry from '$/components/article/ArticleListEntry'
import { QueryLink } from '$/components/util/QueryLink'
import { api, useIsLoggedIn } from '$/lib/api'
import { useSearchParams } from 'next/navigation'
import { type FunctionComponent, useMemo } from 'react'

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

  const [selectedFeedType, limit, offset, isTagSelected] = useMemo(() => {
    const selectedFeedType = searchParams.get('feedType') ?? defaultTab
    const limit = parseInt(searchParams.get('limit') ?? pageSize.toString())
    const offset = parseInt(searchParams.get('offset') ?? (1).toString())
    const isTagSelected = selectedFeedType.startsWith('#')
    return [selectedFeedType, limit, offset, isTagSelected]
  }, [defaultTab, searchParams])

  const finalTags = useMemo(() => [...tabs, isTagSelected && selectedFeedType], [isTagSelected, selectedFeedType, tabs])

  const { data: allArticles, isLoading: isLoadingAllArticles, refetch: refetchAll } = api.articles.getArticles.useQuery(
    {
      limit, offset, tag: isTagSelected
                          ? selectedFeedType.replace('#', '')
                          : undefined, favorited: selectedFeedType === 'favourite'
                                                  ? username
                                                  : undefined, author: selectedFeedType === 'personal'
                                                                       ? username
                                                                       : undefined,
    },
    { enabled: selectedFeedType !== 'feed' },
  )
  const { data: feedArticles, isLoading: isLoadingFeedArticles, isStale: isFeedArticlesStale, refetch: refetchFeed } = api.articles.getArticleFeed.useQuery(
    { limit, offset },
    { enabled: selectedFeedType === 'feed' && !!isLoggedIn },
  )

  const refetch = selectedFeedType === 'feed' ? refetchFeed : refetchAll

  const [articles, isLoadingArticles] = useMemo(() => {
    const articles = selectedFeedType !== 'feed' ? allArticles : feedArticles
    const isLoading = selectedFeedType !== 'feed'
                      ? isLoadingAllArticles
                      : (isLoadingFeedArticles && !isFeedArticlesStale)
    return [articles, isLoading]
  }, [selectedFeedType, allArticles, feedArticles, isLoadingAllArticles, isLoadingFeedArticles, isFeedArticlesStale])

  const articlePagination = useMemo(() => {
    if (!articles?.articlesCount) {
      return []
    }
    const pageCount = Math.ceil(articles.articlesCount / pageSize)
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }, [articles?.articlesCount])

  // TODO Fix bug, when you are on last page and then unfavorite an article, the page stays on the last page, even though it does not exist anymore
  // TODO Do proper pagination with only showing the first 5 pages and the last 5 pages and the current page

  return <div className={ className }>
    <div className={ toggleClassName }>
      <ul className='nav nav-pills outline-active'>
        {
          (finalTags.filter(Boolean) as Array<ArticleType>).map((feedType) => <li
            key={ feedType }
            className='nav-item'
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
      !isLoadingArticles && !articles?.articles?.length && <div className="article-preview">No articles are here... yet.</div>
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
          <QueryLink
            className={ 'page-link' + (page === offset ? ' active' : '') }
            query={ { offset: page.toString() } }
          >
            { page }
          </QueryLink>
        </li>)
      }
    </ul>
  </div>
}
