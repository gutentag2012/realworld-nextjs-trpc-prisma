import { AuthorIcon } from '$/components/article/AuthorIcon'
import { FavoriteButton } from '$/components/social/FavoriteButton'
import { FollowButton } from '$/components/social/FollowButton'
import { api, type RouterOutputs } from '$/lib/api'
import { Layout } from '$/pages/Layout'
import format from 'date-fns/format'
import matter from 'gray-matter'
import { type NextPage } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { remark } from 'remark'
import html from 'remark-html'

function ArticleMeta({
                       article,
                       onDelete,
                       ownProfile,
                       refetch,
                     }: {
  article: RouterOutputs['articles']['getArticles']['articles'][number],
  ownProfile: boolean,
  onDelete: () => void
  refetch: () => void
}) {
  return <div className='article-meta'>
    <AuthorIcon
      user={ article.author }
      date={ new Date(article.createdAt) }
    />

    {
      !ownProfile
      ? <>
        <FollowButton
          user={ article.author }
          isOwnProfile={ ownProfile }
          onSuccess={ refetch }
        />
        &nbsp;&nbsp;
        <FavoriteButton
          article={ article }
          transformText={ count => <>&nbsp;Favorite Article <span className='counter'>({ count })</span></> }
          onToggleFavorite={ refetch }
        />
      </>
      : <>
        <Link
          href={ '/editor/' + encodeURIComponent(article.slug) }
          className='btn btn-sm btn-outline-secondary'
        >
          <i className='ion-edit' /> &nbsp;Edit Article
        </Link>
        &nbsp;&nbsp;
        <button
          className='btn btn-sm btn-outline-danger'
          onClick={ onDelete }
        >
          <i className='ion-trash-a' /> &nbsp;Delete Article
        </button>
      </>
    }
  </div>
}

const Article: NextPage = () => {
  const {
    query: { article: articleSlug },
    push,
  } = useRouter()

  // State
  const [articleHTML, setArticleHTML] = useState('')

  // Data
  const { data: { user: currentUser } = {} } = api.auth.me.useQuery()
  const {
    data: { article } = {},
    isError,
    isLoading,
    refetch,
  } = api.articles.getArticlesBySlug.useQuery(
    { slug: articleSlug as string })
  const {
    data: articleComments,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = api.comments.getCommentsForArticle.useQuery(
    { slug: articleSlug as string })

  // Actions
  const { mutate: deleteArticle } = api.articles.deleteArticle.useMutation({
    onSuccess: () => push('/')
      .catch(console.error),
  })
  const { mutate: addComment } = api.comments.addCommentToArticle.useMutation({ onSuccess: () => refetchComments() })
  const { mutate: removeComment } = api.comments.removeCommentFromArticle.useMutation(
    { onSuccess: () => refetchComments() })

  // Redirect to home page if article is deleted or not found
  useEffect(() => {
    if (!articleSlug || !isError) {
      return
    }
    push('/')
      .catch(console.error)
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
    return <Layout>
      <div className='article-page'>
        <div className='banner'>
          <div className='container'>
            <h1>Loading...</h1>
          </div>
        </div>
      </div>
    </Layout>
  }

  if (!article) {
    return <Layout>
      <div className='article-page'>
        <div className='banner'>
          <div className='container'>
            <h1>Article not found</h1>
          </div>
        </div>
      </div>
    </Layout>
  }

  const isOwnProfile = currentUser?.username === article.author.username

  const onDelete = () => {
    if (!window.confirm('Are you sure you want to delete the article?')) {
      return
    }
    deleteArticle({ slug: article.slug })
  }

  return <Layout title={ article?.title }>
    <div className='article-page'>
      <div className='banner'>
        <div className='container'>
          <h1>{ article.title }</h1>

          <ArticleMeta
            article={ article }
            ownProfile={ isOwnProfile }
            onDelete={ onDelete }
            refetch={ refetch }
          />
        </div>
      </div>

      <div className='container page'>
        <div className='row article-content'>
          <div className='col-md-12'>
            <div dangerouslySetInnerHTML={ { __html: articleHTML } } />
            <ul className='tag-list'>
              {
                article.tagList.map(tag => <li
                    key={ tag }
                    className='tag-default tag-pill tag-outline'
                  >
                    { tag }
                  </li>,
                )
              }
            </ul>
          </div>
        </div>

        <hr />

        <div className='article-actions'>
          <ArticleMeta
            article={ article }
            ownProfile={ isOwnProfile }
            onDelete={ onDelete }
            refetch={ refetch }
          />
        </div>

        {
          currentUser
          ? (
            <div className='row'>
              <div className='col-xs-12 col-md-8 offset-md-2'>
                <form
                  className='card comment-form'
                  onSubmit={ e => {
                    e.preventDefault()

                    const target = e.target as HTMLFormElement
                    const comment = target.comment.value

                    addComment({
                      slug: article.slug,
                      comment: {
                        body: comment,
                      },
                    })

                    target.comment.value = ''
                  } }
                >
                  <div className='card-block'>
                    <textarea
                      className='form-control'
                      placeholder='Write a comment...'
                      rows={ 3 }
                      name='comment'
                    />
                  </div>
                  <div className='card-footer'>
                    {
                      currentUser?.image && <Image
                            src={ currentUser.image }
                            alt={ currentUser.username + ' profile picture' }
                            className='comment-author-img'
                            width={ 30 }
                            height={ 30 }
                        />
                    }
                    <button
                      className='btn btn-sm btn-primary'
                      type='submit'
                    >
                      Post Comment
                    </button>
                  </div>
                </form>

                {
                  isLoadingComments && <div className='card'>
                        <div className='card-block'>
                            <p className='card-text'>Loading comments...</p>
                        </div>
                    </div>
                }

                {
                  articleComments?.comments.map(comment => <div
                      key={ comment.id }
                      className='card'
                    >
                      <div className='card-block'>
                        <p className='card-text'>{ comment.body }</p>
                      </div>
                      <div className='card-footer'>
                        <Link
                          href={ `/profile/${ encodeURIComponent(comment.author.username) }` }
                          className='comment-author'
                        >
                          {
                            comment.author.image && <Image
                                  src={ comment.author.image }
                                  alt='Author profile picture'
                                  className='comment-author-img'
                                  width={ 20 }
                                  height={ 20 }
                              />
                          }
                        </Link>
                        &nbsp; &nbsp;
                        <Link
                          href={ `/profile/${ encodeURIComponent(comment.author.username) }` }
                          className='comment-author'
                        >
                          { comment.author.username }
                        </Link>
                        <span className='date-posted'>{ format(new Date(comment.createdAt), 'MMM d, yyyy') }</span>
                        {
                          comment.author.username === currentUser?.username &&
                            <span className='mod-options'>
                              <i
                                  className='ion-trash-a'
                                  onClick={ () => removeComment({
                                    slug: articleSlug as string,
                                    id: comment.id,
                                  }) }
                              />
                            </span>
                        }
                      </div>
                    </div>,
                  )
                }
              </div>
            </div>
          )
          : (
            <div className='row'>
              <div className='col-xs-12 col-md-8 offset-md-2'>
                <p>
                  <Link href='/login'>Sign in</Link> or <Link href='/register'>sign up</Link> to add comments on this article.
                </p>
              </div>
            </div>
          )
        }
      </div>
    </div>
  </Layout>
}

export default Article
