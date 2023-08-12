import { AuthorIcon } from '$/components/article/AuthorIcon'
import { FavoriteButton } from '$/components/social/FavoriteButton'
import { type RouterOutputs } from '$/lib/api'
import Link from 'next/link'
import React from 'react'

interface Props {
  article: RouterOutputs['articles']['getArticles']['articles'][number]
  onToggleFavorite?: (article: RouterOutputs['articles']['getArticles']['articles'][number]) => void
}

const ArticleListEntry: React.FC<Props> = ({ article, onToggleFavorite }) => {
  return (
    <div className="article-preview">
      <div className="article-meta">
        <AuthorIcon user={article.author} date={new Date(article.createdAt)} />
        <FavoriteButton
          article={article}
          onToggleFavorite={onToggleFavorite}
          className="pull-xs-right"
        />
      </div>
      <Link href={`/article/${encodeURIComponent(article.slug)}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {article.tagList.map(tag => (
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  )
}

export default ArticleListEntry
