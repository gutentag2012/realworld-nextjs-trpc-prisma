import { api, type RouterOutputs, useIsLoggedIn } from '$/lib/api'
import { useRouter } from 'next/router'
import React, { type FunctionComponent, type ReactNode } from 'react'

interface followButtonProps {
  isOwnProfile?: boolean
  user: RouterOutputs['profiles']['getProfileByName']['profile']
  onSuccess?: () => void
  transformText?: (input: string) => ReactNode
}

type Props = followButtonProps

export const FollowButton: FunctionComponent<Props> = ({
  isOwnProfile,
  user,
  onSuccess,
  transformText = e => e,
}) => {
  const { push } = useRouter()
  const isLoggedIn = useIsLoggedIn()

  const { mutate: follow } = api.profiles.followProfile.useMutation({ onSuccess })
  const { mutate: unfollow } = api.profiles.unFollowProfile.useMutation({ onSuccess })

  if (isOwnProfile) {
    return null
  }

  return (
    <button
      className={`btn btn-sm ${
        user.following ? 'btn-secondary' : 'btn-outline-secondary'
      } action-btn`}
      onClick={() => {
        if (!isLoggedIn) {
          return push('/register')
        }
        const fn = user.following ? unfollow : follow
        fn({ username: user.username })
      }}
    >
      <i className="ion-plus-round" /> &nbsp;
      {transformText(`${user.following ? 'Unfollow' : 'Follow'} ${user.username}`)}
    </button>
  )
}
