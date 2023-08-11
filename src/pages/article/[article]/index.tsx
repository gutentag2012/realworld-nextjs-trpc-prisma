import { ArticleMeta } from '$/components/article/ArticleMeta'
import { AddCommentForm } from '$/components/comments/AddCommentForm'
import { ArticleComment } from '$/components/comments/ArticleComment'
import { api } from '$/lib/api'
import { Layout } from '$/pages/Layout'
import matter from 'gray-matter'
import { type NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { remark } from 'remark'
import html from 'remark-html'

const Article: NextPage = () => {
  const { query, push } = useRouter()
  const articleSlug = query.article as string

  // State
  const [articleHTML, setArticleHTML] = useState('')

  // Data
  const { data: userData } = api.auth.me.useQuery()
  const user = userData?.user

  const {
    data: articleData,
    isError,
    isLoading,
    refetch,
  } = api.articles.getArticlesBySlug.useQuery({ slug: articleSlug })
  const article = articleData?.article

  const { data: articleComments, isLoading: isLoadingComments } = api.comments.getCommentsForArticle.useQuery({
    slug: articleSlug,
  })

  // Actions
  const { mutate: deleteArticle } = api.articles.deleteArticle.useMutation({
    onSuccess: () => push('/').catch(console.error),
  })

  // Redirect to home page if article is deleted or not found
  useEffect(() => {
    if (!articleSlug || !isError) {
      return
    }
    push('/').catch(console.error)
  }, [articleSlug, isError, push])

  // Parse markdown to HTML
  useEffect(() => {
    if (!article?.body) {
      return
    }
    const matterParsed = matter(article.body)
    remark()
      .use(html)
      .process(matterParsed.content)
      .then(html => setArticleHTML(html.toString()))
      .catch(console.error)
  }, [article])

  if (isLoading) {
    return (
      <Layout>
        <div className="article-page">
          <div className="banner">
            <div className="container">
              <h1>Loading...</h1>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!article) {
    return (
      <Layout>
        <div className="article-page">
          <div className="banner">
            <div className="container">
              <h1>Article not found</h1>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const isOwnProfile = user?.username === article.author.username

  const onDelete = () => {
    if (!window.confirm('Are you sure you want to delete the article?')) {
      return
    }
    deleteArticle({ slug: article.slug })
  }

  return (
    <Layout title={article?.title}>
      <div className="article-page">
        <div className="banner">
          <div className="container">
            <h1>{article.title}</h1>

            <ArticleMeta article={article} ownProfile={isOwnProfile} onDelete={onDelete} refetch={refetch} />
          </div>
        </div>

        <div className="container page">
          <div className="row article-content">
            <div className="col-md-12">
              <div dangerouslySetInnerHTML={{ __html: articleHTML }} />
              <ul className="tag-list">
                {article.tagList.map(tag => (
                  <li key={tag} className="tag-default tag-pill tag-outline">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <hr />

          <div className="article-actions">
            <ArticleMeta article={article} ownProfile={isOwnProfile} onDelete={onDelete} refetch={refetch} />
          </div>

          {user ? (
            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                <AddCommentForm slug={articleSlug} currentUser={user} />

                {isLoadingComments && (
                  <div className="card">
                    <div className="card-block">
                      <p className="card-text">Loading comments...</p>
                    </div>
                  </div>
                )}

                {articleComments?.comments.map(comment => (
                  <ArticleComment
                    key={comment.id}
                    slug={articleSlug}
                    comment={comment}
                    isOwnComment={user?.username === comment.author.username}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                <p>
                  <Link href="/login">Sign in</Link> or <Link href="/register">sign up</Link> to add comments on this
                  article.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Article
