import { type RouterOutputs } from '$/lib/api'
import React, { type FunctionComponent, useEffect, useState } from 'react'

interface CreateOrUpdateArticleFormProps {
  onSubmit: (data: Record<string, string>, tagList: Array<string>) => void
  errors?: Array<string>
  article?: RouterOutputs['articles']['getArticles']['articles'][number]
}

type Props = CreateOrUpdateArticleFormProps

export const CreateOrUpdateArticleForm: FunctionComponent<Props> = ({ onSubmit, errors, article }) => {
  // Input state for the tag input
  const [tagList, setTagList] = useState<Array<string>>([])

  console.log(article)

  useEffect(() => {
    if (!article?.tagList) {
      return
    }
    setTagList(article?.tagList)
  }, [article])

  return <div className='editor-page'>
    <div className='container page'>
      <div className='row'>
        <div className='col-md-10 offset-md-1 col-xs-12'>
          <ul className='error-messages'>
            {
              errors?.map((error, i) => <li key={ i }>{ error }</li>)
            }
          </ul>

          <form
            onSubmit={ e => {
              e.preventDefault()
              const target = e.target as HTMLFormElement
              const formData = new FormData(target)
              const data = Object.fromEntries(formData.entries()) as Record<string, string>

              onSubmit(data, tagList)
            } }
          >
            <fieldset>
              <fieldset className='form-group'>
                <input
                  type='text'
                  className='form-control form-control-lg'
                  placeholder='Article Title'
                  name='title'
                  defaultValue={ article?.title }
                />
              </fieldset>
              <fieldset className='form-group'>
                <input
                  type='text'
                  className='form-control'
                  placeholder="What's this article about?"
                  name='description'
                  defaultValue={ article?.description }
                />
              </fieldset>
              <fieldset className='form-group'>
              <textarea
                className='form-control'
                rows={ 8 }
                placeholder='Write your article (in markdown)'
                name='body'
                defaultValue={ article?.body }
              />
              </fieldset>
              <fieldset className='form-group'>
                <input
                  type='text'
                  className='form-control'
                  placeholder='Enter tags'
                  disabled={ !!article }
                  onKeyDown={ e => {
                    if (e.key !== 'Enter' || !!article) {
                      return
                    }

                    e.preventDefault()
                    const target = e.target as HTMLInputElement
                    const value = target.value.trim()

                    if (tagList.includes(value) || !value) {
                      return
                    }

                    setTagList([...tagList, value])
                    target.value = ''
                  } }
                />
                <div className='tag-list'>
                  {
                    tagList.map((tag, i) => <span
                      key={ i }
                      className='tag-default tag-pill'
                    >
                      {
                        !article && (<>
                          <i
                            className='ion-close-round'
                            onClick={ () => setTagList(tagList.filter((_, index) => i !== index)) }
                          />&nbsp;
                        </>)
                      }
                      { tag }
                      </span>)
                  }
                </div>
              </fieldset>
              <button
                className='btn btn-lg pull-xs-right btn-primary'
                type='submit'
              >
                Publish Article
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
}
