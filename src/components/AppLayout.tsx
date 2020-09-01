// import React, { ReactNode } from 'react'
import React, { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { DBProvider } from './OldProvider'
import TodoList from './TodoList'
import LoaderAnim from './LoaderAnim'

// interface AppLayoutProps {
//   children: ReactNode
// }

// const AppLayout = ( { children }: AppLayoutProps) => {
const AppLayout = () => {
  const {
    isLoading,
    error,
    isAuthenticated,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0()

  const [token, setToken] = useState<string>('')

  const redirectUri = process.env.REACT_APP_AUTH0_REDIR_URL

  useEffect(() => {
    (async () => {
      try {
        // this basically identifies who will be consuming the JWT token in the 
        // context consumer via the getAccessTokenSilently method. It needs to match
        // an API config'd in auth0 (navigate to APIs in dash)
        const authAudienceUri = process.env.REACT_APP_HASURA_ENDPOINT || ''

        const theToken = await getAccessTokenSilently({
          audience: authAudienceUri,
          responseType: 'token',
          scope: 'openid',
        })
        setToken(theToken)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [getAccessTokenSilently])



  if (isLoading) return (<LoaderAnim />)
  if (error) {
    console.error('an error occurred in auth module:', error)
    return (<div>Oops! Something went wrong...</div>)
  }

  return (
    <div className="appwrapper">
      <nav className="navbar">
        <div className="logotext">Proof Of Concept!</div>
        <div className="nav-items">
          { !isAuthenticated && (
            <button onClick={loginWithRedirect}>Log in</button>
          )}
          { isAuthenticated && (
            <>
              <span>{user.nickname}</span>
              <button onClick={() => {
                logout({ returnTo: redirectUri })
              }}>Log out</button>
            </>
          )}
        </div>
      </nav>
      <section className="main">
        { isAuthenticated && token ? (
          <DBProvider authedUser={user} authToken={token}>
            <TodoList />
          </DBProvider>
        ) : (
          <p> Welcome to the POC app! Log in to see your list </p>
        )}
      </section>
    </div>
  )

}

export default AppLayout