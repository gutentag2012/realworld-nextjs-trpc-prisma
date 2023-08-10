import { type RouterOutputs } from '$/lib/api'
import format from 'date-fns/format'
import Link from 'next/link'
import React, { type FunctionComponent } from 'react'

interface UserIconProps {
  user: RouterOutputs['articles']['getArticles']['articles'][number]['author']
  date?: Date
}

type Props = UserIconProps

export const AuthorIcon: FunctionComponent<Props> = ({ user, date }) => {
  return <>
    <Link href={ `/profile/${ encodeURIComponent(user?.username ?? '') }` }>
      {/* eslint-disable-next-line @next/next/no-img-element */ }
      <img
        src={ user?.image ?? '' }
        alt='Author profile picture'
      />
    </Link>
    <div className='info'>
      <Link
        href={ `/profile/${ encodeURIComponent(user?.username ?? '') }` }
        className='author'
      >
        { user?.username }
      </Link>
      {
        date &&
          <span className='date'>{ format(date, 'MMMM d, yyyy') }</span>
      }
    </div>
  </>
}
