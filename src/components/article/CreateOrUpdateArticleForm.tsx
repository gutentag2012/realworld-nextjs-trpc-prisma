import { TagInput } from '$/components/util/TagInput'
import { type RouterOutputs } from '$/lib/api'
import React, { type FunctionComponent, useEffect, useState } from 'react'
import { z } from 'zod'

const CreateOrUpdateArticleSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  body: z.string().optional(),
})

interface CreateOrUpdateArticleFormProps {
  onSubmit: (data: Record<string, string>, tagList: Array<string>) => void
  errors?: Array<string>
  article?: RouterOutputs['articles']['getArticles']['articles'][number]
}

type Props = CreateOrUpdateArticleFormProps

export const CreateOrUpdateArticleForm: FunctionComponent<Props> = ({
  onSubmit,
  errors,
  article,
}) => {
  // Input state for the tag input
  const [tagList, setTagList] = useState<Array<string>>([])

  useEffect(() => {
    if (!article?.tagList) {
      return
    }
    setTagList(article?.tagList)
  }, [article])

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ul className="error-messages">
              {errors?.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>

            <form
              onSubmit={e => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)

                const data = CreateOrUpdateArticleSchema.parse(
                  Object.fromEntries(formData.entries()),
                )

                onSubmit(data, tagList)
              }}
            >
              <fieldset>
                <fieldset className="form-group">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Article Title"
                    name="title"
                    defaultValue={article?.title}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="What's this article about?"
                    name="description"
                    defaultValue={article?.description}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    name="body"
                    defaultValue={article?.body}
                  />
                </fieldset>
                <TagInput article={article} tagList={tagList} setTagList={setTagList} />
                <button className="btn btn-lg pull-xs-right btn-primary" type="submit">
                  Publish Article
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
