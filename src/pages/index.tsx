import { ArticleListTabs } from '$/components/article/ArticleListTabs'
import { Layout } from '$/components/Layout'
import { QueryLink } from '$/components/util/QueryLink'
import { Spinner } from '$/components/util/Spinner'
import { api, useIsLoggedIn } from '$/lib/api'
import { type NextPage } from 'next'
import { useSearchParams } from 'next/navigation'

const Home: NextPage = () => {
  const isLoggedInVal = useIsLoggedIn()
  const searchParams = useSearchParams()

  const selectedTag = searchParams.get('tag') ?? undefined

  const { data: tags, isLoading: isLoadingTags } = api.tags.getUniqueTags.useQuery()

  return (
    <Layout>
      <div className="home-page">
        <div className="banner">
          <div className="container">
            <h1 className="logo-font" data-testid="banner-title">
              conduit
            </h1>
            <p>A place to share your knowledge.</p>
          </div>
        </div>

        <div className="container page">
          <div className="row">
            <ArticleListTabs
              className="col-md-9"
              tabs={[isLoggedInVal && 'feed', 'global']}
              defaultTab="global"
              toggleClassName="feed-toggle"
            />

            <div className="col-md-3">
              <div className="sidebar">
                <p>Popular Tags</p>

                <div className="tag-list">
                  {isLoadingTags ? (
                    <Spinner size={24} />
                  ) : (
                    tags?.tags?.map(tag => (
                      <QueryLink
                        key={tag}
                        className="tag-pill tag-default"
                        query={{ feedType: tag === selectedTag ? '' : `#${tag}` }}
                      >
                        {tag}
                      </QueryLink>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Home
