import { api, type RouterOutputs } from '$/lib/api'
import Image from 'next/image'
import React, { type FC } from 'react'

interface CommentFormProps {
  slug: string
  currentUser: RouterOutputs['auth']['me']['user']
}

export const AddCommentForm: FC<CommentFormProps> = ({
  currentUser: { image, username },
  slug,
}) => {
  const ctx = api.useUtils()
  const { mutate: addComment, isLoading } = api.comments.addCommentToArticle.useMutation({
    onSuccess: () => ctx.comments.getCommentsForArticle.invalidate(),
  })

  return (
    <form
      className="card comment-form"
      onSubmit={e => {
        e.preventDefault()

        const commentInput = e.currentTarget.comment as HTMLInputElement
        const comment = commentInput.value

        addComment({
          slug,
          comment: {
            body: comment,
          },
        })

        commentInput.value = ''
      }}
    >
      <div className="card-block">
        <textarea
          className="form-control"
          placeholder="Write a comment..."
          rows={3}
          disabled={isLoading}
          name="comment"
        />
      </div>
      <div className="card-footer">
        {image && (
          <Image
            src={image}
            alt={`${username} profile picture`}
            className="comment-author-img"
            width={30}
            height={30}
          />
        )}
        <button className="btn btn-sm btn-primary" type="submit" disabled={isLoading}>
          Post Comment
        </button>
      </div>
    </form>
  )
}
