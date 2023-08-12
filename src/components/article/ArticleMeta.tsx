import { AuthorIcon } from '$/components/article/AuthorIcon'
import { FavoriteButton } from '$/components/social/FavoriteButton'
import { FollowButton } from '$/components/social/FollowButton'
import { type RouterOutputs } from '$/lib/api'
import Link from 'next/link'
import React, { type FC } from 'react'

interface ArticleMetaProps {
  article: RouterOutputs['articles']['getArticles']['articles'][number]
  ownProfile: boolean
  onDelete: () => void
  refetch: () => void
}

export const ArticleMeta: FC<ArticleMetaProps> = ({
  article,
  onDelete,
  ownProfile,
  refetch,
}: ArticleMetaProps) => {
  return (
    <div className="article-meta">
      <AuthorIcon user={article.author} date={new Date(article.createdAt)} />

      {!ownProfile ? (
        <>
          <FollowButton user={article.author} isOwnProfile={ownProfile} onSuccess={refetch} />
          &nbsp;&nbsp;
          <FavoriteButton
            article={article}
            transformText={count => (
              <>
                &nbsp;Favorite Article <span className="counter">({count})</span>
              </>
            )}
            onToggleFavorite={refetch}
          />
        </>
      ) : (
        <>
          <Link
            href={`/editor/${encodeURIComponent(article.slug)}`}
            className="btn btn-sm btn-outline-secondary"
          >
            <i className="ion-edit" /> &nbsp;Edit Article
          </Link>
          &nbsp;&nbsp;
          <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
            <i className="ion-trash-a" /> &nbsp;Delete Article
          </button>
        </>
      )}
    </div>
  )
}
