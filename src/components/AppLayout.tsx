// import React, { ReactNode } from 'react'
import React, { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { DBProvider } from './OldProvider'
import TodoList from './TodoList'
import LoaderAnim from './LoaderAnim'
import LoginButton from './LoginButton'
import LogoutButton from './LogoutButton'


// import { FeatherCurrentUserHookInterface } from '../auth/types'

// // >>> feather has no ts types yet, so:
// // import { AuthenticationForm, useCurrentUser } from 'feather-client-react'
// const FeatherClientReact = require('feather-client-react')
// const AuthenticationForm = FeatherClientReact.AuthenticationForm
// const useCurrentUser = FeatherClientReact.useCurrentUser
// // <<<


// interface AppLayoutProps {
//   children: ReactNode
// }

// const AppLayout = ( { children }: AppLayoutProps) => {
const AppLayout = () => {
  const [authToken, setAuthToken] = useState<string>('')
  // const {
  //   loading,
  //   currentUser,
  // }:FeatherCurrentUserHookInterface = useCurrentUser()

  const {
    isLoading,
    error,
    user,
    // isAuthenticated,
    getAccessTokenSilently,
  } = useAuth0()

  useEffect(() => {
    (async () => {
      if(!authToken) {
        try {
          const token = await getAccessTokenSilently({
            audience: process.env.REACT_APP_HASURA_ENDPOINT,
          })
          setAuthToken(token)
        } catch (error) {
          console.error(error)
        }
      }
    })()
  }, [authToken, getAccessTokenSilently])

  // const styles = {
  //   title: (provided: any) => ({
  //     ...provided,
  //     fontSize: "40px",
  //     fontWeight: 700
  //   })
  // }

  if (isLoading) return (<LoaderAnim />)

  if (error) return (<p>Oop... something went wrong!</p>)

  // if (!currentUser) return (
  //   <div className="app">
  //     <AuthenticationForm styles={styles} />
  //   </div>
  // )

  return (
    <div className="appwrapper">
      <nav className="navbar">
        <div className="logotext">Proof Of Concept!</div>
        <div className="nav-items">
          <span>{user.name}</span>
          <LoginButton />
          <LogoutButton />
        </div>
      </nav>
      <section className="main">
        {authToken && (
          <DBProvider authToken={authToken}>
            <TodoList />
          </DBProvider>
        )}
      </section>
    </div>
  )

}

export default AppLayout