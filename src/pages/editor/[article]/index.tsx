import { CreateOrUpdateArticleForm } from '$/components/article/CreateOrUpdateArticleForm'
import { Layout } from '$/components/Layout'
import { Spinner } from '$/components/util/Spinner'
import { api } from '$/lib/api'
import { getErrorArrayFromTrpcResponseError } from '$/lib/errors'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const Editor: NextPage = () => {
  const { query, push } = useRouter()
  const articleSlug = query.article as string

  // Data
  const {
    data: articleData,
    isError: isArticleLoadError,
    isLoading,
  } = api.articles.getArticlesBySlug.useQuery({ slug: articleSlug }, { enabled: !!articleSlug })
  const article = articleData?.article

  // Actions
  const {
    mutate: updateArticle,
    isError,
    error,
  } = api.articles.updateArticle.useMutation({
    onSuccess: ({ article: { slug } }) => push(`/article/${slug}`).catch(console.error),
  })

  // Reroute if article slug is not provided or if article is not found
  useEffect(() => {
    if (!!articleSlug && !isArticleLoadError) {
      return
    }
    push('/').catch(console.error)
  }, [articleSlug, isArticleLoadError, push])

  const errors = getErrorArrayFromTrpcResponseError(error, isError)

  return (
    <Layout title={article?.title} privateRoute restrictForUsername={article?.author?.username}>
      {isLoading && (
        <div className="article-page">
          <div className="banner">
            <div className="container">
              <h1>
                <span style={{ marginRight: 16 }}>
                  <Spinner color="white" size={32} />
                </span>
                Loading...
              </h1>
            </div>
          </div>
        </div>
      )}
      {article && (
        <CreateOrUpdateArticleForm
          errors={errors}
          article={article}
          onSubmit={(data: Record<string, string>) =>
            updateArticle({
              slug: articleSlug,
              article: {
                title: data.title!,
                description: data.description!,
                body: data.body!,
              },
            })
          }
        />
      )}
    </Layout>
  )
}

export default Editor
