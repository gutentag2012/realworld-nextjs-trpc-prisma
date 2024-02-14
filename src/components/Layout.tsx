'use client'
// noinspection JSUnresolvedLibraryURL

import { api, useIsLoggedIn } from '$/lib/api'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { type FunctionComponent, useEffect } from 'react'

interface LayoutProps {
  children: React.ReactNode
  privateRoute?: boolean
  restrictForUsername?: string
  title?: string
}

type Props = LayoutProps

const guestLinks: Array<[string, string]> = [
  ['/', 'Home'],
  ['/login', 'Sign in'],
  ['/register', 'Sign up'],
]

export const Layout: FunctionComponent<Props> = ({
  children,
  privateRoute,
  restrictForUsername,
  title,
}) => {
  const isLoggedIn = useIsLoggedIn()
  const { push, pathname } = useRouter()

  // Get current user
  const { data: { user } = {}, isLoading } = api.auth.me.useQuery(undefined, {
    enabled: isLoggedIn,
  })

  // If this is a private route and the user is not logged in, redirect to the login page
  useEffect(() => {
    const isRestricted = restrictForUsername && user?.username !== restrictForUsername && !isLoading
    const isPrivateRoute = privateRoute && !isLoading && !user
    if (!isRestricted && !isPrivateRoute) {
      return
    }
    push('/').catch(console.error)
  }, [push, privateRoute, restrictForUsername, user, isLoading])

  return (
    <>
      <Head>
        <title>{title ?? 'Conduit'}</title>
      </Head>
      {user ? (
        <nav className="navbar navbar-light">
          <div className="container">
            <Link className="navbar-brand" href="/">
              conduit
            </Link>
            <ul className="nav navbar-nav pull-xs-right">
              <li className="nav-item">
                <Link className={`nav-link${pathname === '/' ? ' active' : ''}`} href="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link${pathname === '/editor' ? ' active' : ''}`}
                  href="/editor"
                >
                  <i className="ion-compose" /> New Article
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link${pathname === '/settings' ? ' active' : ''}`}
                  href="/settings"
                >
                  <i className="ion-gear-a" /> Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link${
                    pathname === `/profile/${encodeURIComponent(user.username)}` ? ' active' : ''
                  }`}
                  href={`/profile/${encodeURIComponent(user.username)}`}
                >
                  {user.image && (
                    <Image
                      src={user.image}
                      alt="Profile picture"
                      className="user-pic"
                      width={26}
                      height={26}
                    />
                  )}
                  {user.username}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      ) : (
        <nav className="navbar navbar-light">
          <div className="container">
            <Link className="navbar-brand" href="/">
              conduit
            </Link>
            <ul className="nav navbar-nav pull-xs-right">
              {guestLinks.map(([path, text]) => (
                <li key={path} className="nav-item">
                  <Link
                    className={['nav-link', path === pathname && 'active']
                      .filter(Boolean)
                      .join(' ')}
                    href={path}
                  >
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
      {children}
      <footer>
        <div className="container">
          <Link href="/" className="logo-font">
            conduit
          </Link>
          <span className="attribution">
            An interactive learning project from <a href="https://thinkster.io">Thinkster</a>. Code
            &amp; design licensed under MIT.
          </span>
        </div>
      </footer>
    </>
  )
}
