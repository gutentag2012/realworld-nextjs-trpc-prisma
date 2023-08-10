import { Layout } from '$/pages/Layout'
import { api, setToken } from '$/lib/api'
import { type NextPage } from 'next'

const Login: NextPage = () => {
  const ctx = api.useContext()
  const { data: { user }={} } = api.auth.me.useQuery()

  const {mutate: updateUser, error, isError, isLoading } = api.auth.updateUser.useMutation({onSuccess: () => ctx.auth.me.refetch()})

  if (!user) {
    return <Layout privateRoute>
      Not logged in
    </Layout>
  }

  const errors = !isError
                 ? undefined
                 : error?.data?.zodError?.fieldErrors
                   ? Object.entries(error?.data?.zodError?.fieldErrors)
                     .flatMap(([key, value]) => value?.map(v => `${ key }: ${ v }`))
                   : [error?.message ?? 'Unknown error']

  return <Layout privateRoute>
    <div className='settings-page'>
      <div className='container page'>
        <div className='row'>
          <div className='col-md-6 offset-md-3 col-xs-12'>
            <h1 className='text-xs-center'>Your Settings</h1>

            <ul className='error-messages'>
              {
                errors?.map((error, i) => <li key={ i }>{ error }</li>)
              }
            </ul>

            <form
              onSubmit={ e => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const data = new FormData(form)
                const body = Object.fromEntries(data.entries())
                updateUser(body)
              } }
            >
              <fieldset>
                <fieldset className='form-group'>
                  <input
                    className='form-control'
                    type='text'
                    name={ 'image' }
                    placeholder='URL of profile picture'
                    disabled={ isLoading }
                    defaultValue={ user.image ?? "" }
                  />
                </fieldset>
                <fieldset className='form-group'>
                  <input
                    className='form-control form-control-lg'
                    type='text'
                    placeholder='Your Name'
                    name={ 'username' }
                    disabled={ isLoading }
                    defaultValue={ user.username }
                  />
                </fieldset>
                <fieldset className='form-group'>
              <textarea
                className='form-control form-control-lg'
                rows={ 8 }
                placeholder='Short bio about you'
                name={ 'bio' }
                disabled={ isLoading }
                defaultValue={ user.bio ?? "" }
              />
                </fieldset>
                <fieldset className='form-group'>
                  <input
                    className='form-control form-control-lg'
                    type='text'
                    placeholder='Email'
                    name={ 'email' }
                    disabled={ isLoading }
                    defaultValue={ user.email }
                  />
                </fieldset>
                <fieldset className='form-group'>
                  <input
                    className='form-control form-control-lg'
                    type='password'
                    name={ 'password' }
                    disabled={ isLoading }
                    placeholder='New Password'
                  />
                </fieldset>
                <button
                  className='btn btn-lg btn-primary pull-xs-right'
                  type={ 'submit' }
                  disabled={ isLoading }
                >
                  Update Settings
                </button>
              </fieldset>
            </form>
            <hr />
            <button
              className='btn btn-outline-danger'
              type={ 'button' }
              disabled={ isLoading }
              onClick={ () => {
                setToken(null)
                ctx.auth.me.reset()
                  .then(() => console.log('reset'))
                  .catch(err => console.error('reset', err))
              } }
            >
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  </Layout>
}

export default Login
