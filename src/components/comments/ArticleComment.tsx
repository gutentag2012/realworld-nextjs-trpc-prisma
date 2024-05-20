import { Spinner } from '$/components/util/Spinner'
import { api, type RouterOutputs } from '$/lib/api'
import format from 'date-fns/format'
import Image from 'next/image'
import Link from 'next/link'
import React, { type FunctionComponent } from 'react'

interface ArticleCommentProps {
  slug: string
  comment: RouterOutputs['comments']['getCommentsForArticle']['comments'][number]
  isOwnComment?: boolean
}

type Props = ArticleCommentProps

export const ArticleComment: FunctionComponent<Props> = ({ comment, isOwnComment, slug }) => {
  const ctx = api.useUtils()
  const { mutate: removeComment, isLoading } = api.comments.removeCommentFromArticle.useMutation({
    onSuccess: () => ctx.comments.getCommentsForArticle.invalidate(),
  })

  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{comment.body}</p>
      </div>
      <div className="card-footer">
        <Link
          href={`/profile/${encodeURIComponent(comment.author.username)}`}
          className="comment-author"
        >
          {comment.author.image && (
            <Image
              src={comment.author.image}
              alt="Author profile picture"
              className="comment-author-img"
              width={20}
              height={20}
            />
          )}
        </Link>
        &nbsp; &nbsp;
        <Link
          href={`/profile/${encodeURIComponent(comment.author.username)}`}
          className="comment-author"
        >
          {comment.author.username}
        </Link>
        <span className="date-posted">{format(new Date(comment.createdAt), 'MMM d, yyyy')}</span>
        {isOwnComment && isLoading ? (
          <span className="mod-options">
            <Spinner />
          </span>
        ) : (
          <span className="mod-options">
            <i
              className="ion-trash-a"
              onClick={() => !isLoading && removeComment({ slug, id: comment.id })}
            />
          </span>
        )}
      </div>
    </div>
  )
}
