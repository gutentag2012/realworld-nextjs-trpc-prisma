import ArticleListEntry from '$/components/article/ArticleListEntry'
import { Pagination, usePagination } from '$/components/util/Pagination'
import { QueryLink } from '$/components/util/QueryLink'
import { Spinner } from '$/components/util/Spinner'
import { api, useIsLoggedIn } from '$/lib/api'
import { useSearchParams } from 'next/navigation'
import { type FunctionComponent, useMemo } from 'react'

const ArticleTypes = {
  feed: 'Your Feed',
  global: 'Global Feed',
  personal: 'My Articles',
  favourite: 'Favorited Articles',
}

type HashTagArticleType = `#${string}`
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

export const ArticleListTabs: FunctionComponent<Props> = ({
  tabs,
  defaultTab,
  username,
  className,
  toggleClassName,
}) => {
  const isLoggedIn = useIsLoggedIn()
  const searchParams = useSearchParams()

  const pagination = usePagination()

  const [selectedFeedType, isTagSelected] = useMemo(() => {
    const selectedFeedType = searchParams.get('feedType') ?? defaultTab
    const isTagSelected = selectedFeedType.startsWith('#')
    return [selectedFeedType, isTagSelected]
  }, [defaultTab, searchParams])

  const finalTags = useMemo(
    () => [...tabs, isTagSelected && selectedFeedType],
    [isTagSelected, selectedFeedType, tabs],
  )

  const {
    data: allArticles,
    isLoading: isLoadingAllArticles,
    refetch: refetchAll,
  } = api.articles.getArticles.useQuery(
    {
      ...pagination,
      tag: isTagSelected ? selectedFeedType.replace('#', '') : undefined,
      favorited: selectedFeedType === 'favourite' ? username : undefined,
      author: selectedFeedType === 'personal' ? username : undefined,
    },
    { enabled: selectedFeedType !== 'feed' },
  )
  const {
    data: feedArticles,
    isLoading: isLoadingFeedArticles,
    refetch: refetchFeed,
  } = api.articles.getArticleFeed.useQuery(pagination, {
    enabled: selectedFeedType === 'feed' && isLoggedIn,
  })

  const { articles, isLoadingArticles, refetch } = useMemo(() => {
    return {
      articles: selectedFeedType !== 'feed' ? allArticles : feedArticles,
      isLoadingArticles: selectedFeedType !== 'feed' ? isLoadingAllArticles : isLoadingFeedArticles,
      refetch: selectedFeedType === 'feed' ? refetchFeed : refetchAll,
    }
  }, [
    selectedFeedType,
    allArticles,
    feedArticles,
    isLoadingAllArticles,
    isLoadingFeedArticles,
    refetchFeed,
    refetchAll,
  ])

  return (
    <div className={className}>
      <div className={toggleClassName}>
        <ul className="nav nav-pills outline-active">
          {(finalTags.filter(Boolean) as Array<ArticleType>).map(feedType => (
            <li key={feedType} className="nav-item" data-testid={`feed-type-${feedType}`}>
              <QueryLink
                className={`nav-link ${feedType === selectedFeedType ? 'active' : ''}`}
                query={{ feedType }}
              >
                {ArticleTypes[feedType as PredefinedArticleType] ?? feedType}
              </QueryLink>
            </li>
          ))}
        </ul>
      </div>

      {!isLoadingArticles && !articles?.articles?.length && (
        <div className="article-preview">No articles are here... yet.</div>
      )}
      {isLoadingArticles ? (
        <div className="article-preview">
          <Spinner size={32} />
        </div>
      ) : (
        articles?.articles?.map(article => (
          <ArticleListEntry
            key={article.slug}
            article={article}
            onToggleFavorite={() => refetch()}
          />
        ))
      )}

      <Pagination
        currentCount={articles?.articles?.length}
        totalCount={articles?.articlesCount}
        {...pagination}
      />
    </div>
  )
}
