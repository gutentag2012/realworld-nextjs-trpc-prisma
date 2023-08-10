import { CreateOrUpdateArticleForm } from '$/components/article/CreateOrUpdateArticleForm'
import { api } from '$/lib/api'
import { getErrorArrayFromTrpcResponseError } from '$/lib/errors'
import { Layout } from '$/pages/Layout'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const Editor: NextPage = () => {
  const {
    query: { article: articleSlug },
    push,
  } = useRouter()

  const {
    data: { article } = {},
    error: articleLoadError,
    isLoading,
  } = api.articles.getArticlesBySlug.useQuery(
    { slug: articleSlug as string },
    { enabled: !!articleSlug },
  )

  const {
    mutate: updateArticle,
    isError,
    error,
  } = api.articles.updateArticle.useMutation({
    onSuccess: ({ article: { slug } }) => push(`/article/${ slug }`)
      .catch(console.error),
  })

  useEffect(() => {
    if (!!articleSlug && !articleLoadError) {
      return
    }
    push('/')
      .catch(console.error)
  }, [articleSlug, articleLoadError, push])

  const errors = getErrorArrayFromTrpcResponseError(error, isError)

  return <Layout
    title={ article?.title }
    privateRoute
    restrictForUsername={ article?.author?.username }
  >
    {
      isLoading && <div className='article-page'>
            <div className='banner'>
                <div className='container'>
                    <h1>Loading...</h1>
                </div>
            </div>
        </div>
    }
    {
      article && <CreateOrUpdateArticleForm
            errors={ errors }
            article={ article }
            onSubmit={ (data: Record<string, string>) => updateArticle({
              slug: articleSlug as string,
              article: {
                title: data.title!,
                description: data.description!,
                body: data.body!,
              },
            }) }
        />
    }
  </Layout>
}

export default Editor
