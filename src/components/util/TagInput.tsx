import { type RouterOutputs } from '$/lib/api'
import React, { type FC } from 'react'

interface TagInputProps {
  article?: RouterOutputs['articles']['getArticles']['articles'][number]
  tagList: Array<string>
  setTagList: (tagList: Array<string>) => void
}

export const TagInput: FC<TagInputProps> = ({ article, setTagList, tagList }) => {
  return (
    <fieldset className="form-group">
      <input
        type="text"
        className="form-control"
        placeholder="Enter tags"
        disabled={!!article}
        onKeyDown={e => {
          if (e.key !== 'Enter' || !!article) {
            return
          }
          e.preventDefault()

          const value = e.currentTarget.value.trim()
          if (tagList.includes(value) || !value) {
            return
          }

          setTagList([...tagList, value])
          e.currentTarget.value = ''
        }}
      />
      <div className="tag-list">
        {tagList.map((tag, i) => (
          <span key={i} className="tag-default tag-pill">
            {!article && (
              <>
                <i
                  className="ion-close-round"
                  onClick={() => setTagList(tagList.filter((_, index) => i !== index))}
                />
                &nbsp;
              </>
            )}
            {tag}
          </span>
        ))}
      </div>
    </fieldset>
  )
}
