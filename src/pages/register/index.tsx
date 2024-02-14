import { api, setToken, useIsLoggedIn } from '$/lib/api'
import { getErrorArrayFromTrpcResponseError } from '$/lib/errors'
import { type NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { z } from 'zod'

const RegisterSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
})

const Login: NextPage = () => {
  const { push } = useRouter()
  const isLoggedIn = useIsLoggedIn()

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }
    push('/').catch(console.error)
  }, [push, isLoggedIn])

  const {
    mutate: register,
    isLoading,
    error,
    isError,
  } = api.auth.register.useMutation({
    onSuccess: ({ user }) => {
      setToken(user.token)
      push('/').catch(console.error)
    },
  })

  const errors = getErrorArrayFromTrpcResponseError(error, isError)

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign up</h1>
            <p className="text-xs-center">
              <Link href="/login">Have an account?</Link>
            </p>

            <ul className="error-messages">
              {errors?.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>

            <form
              onSubmit={e => {
                e.preventDefault()
                const data = new FormData(e.currentTarget)

                const body = Object.fromEntries(data.entries())
                const user = RegisterSchema.parse(body)

                register({ user })
              }}
            >
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Username"
                  name="username"
                  disabled={isLoading}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Email"
                  name="email"
                  disabled={isLoading}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="password"
                  placeholder="Password"
                  name="password"
                  disabled={isLoading}
                />
              </fieldset>
              <button className="btn btn-lg btn-primary pull-xs-right">Sign up</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
