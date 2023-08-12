import { CreateOrUpdateArticleForm } from '$/components/article/CreateOrUpdateArticleForm'
import { Layout } from '$/components/Layout'
import { api } from '$/lib/api'
import { getErrorArrayFromTrpcResponseError } from '$/lib/errors'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'

const Editor: NextPage = () => {
  const { push } = useRouter()

  const {
    mutate: createArticle,
    isError,
    error,
  } = api.articles.createArticle.useMutation({
    onSuccess: ({ article: { slug } }) => push(`/article/${slug}`).catch(console.error),
  })

  const errors = getErrorArrayFromTrpcResponseError(error, isError)

  return (
    <Layout privateRoute>
      <CreateOrUpdateArticleForm
        errors={errors}
        onSubmit={(data: Record<string, string>, tagList: Array<string>) =>
          createArticle({
            article: {
              title: data.title!,
              description: data.description!,
              body: data.body!,
              tagList,
            },
          })
        }
      />
    </Layout>
  )
}

export default Editor
