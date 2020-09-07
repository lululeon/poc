// import React, { ReactNode } from 'react'
import React from 'react'
import { DBProvider } from './OldProvider'
import TodoList from './TodoList'
import LoaderAnim from './LoaderAnim'
import { FeatherCurrentUserHookInterface } from '../auth/types'

// >>> feather has no ts types yet, so:
// import { AuthenticationForm, useCurrentUser } from 'feather-client-react'
const FeatherClientReact = require('feather-client-react')
const AuthenticationForm = FeatherClientReact.AuthenticationForm
const useCurrentUser = FeatherClientReact.useCurrentUser
// <<<


// interface AppLayoutProps {
//   children: ReactNode
// }

// const AppLayout = ( { children }: AppLayoutProps) => {
const AppLayout = () => {
  const {
    loading,
    currentUser,
  }:FeatherCurrentUserHookInterface = useCurrentUser()

  const styles = {
    title: (provided: any) => ({
      ...provided,
      fontSize: "40px",
      fontWeight: 700
    })
  }

  if (loading) return (<LoaderAnim />)
  if (!currentUser) return (
    <div className="app">
      <AuthenticationForm styles={styles} />
    </div>
  )

  return (
    <div className="appwrapper">
      <nav className="navbar">
        <div className="logotext">Proof Of Concept!</div>
        <div className="nav-items">
          <span>{currentUser.email}</span>
        </div>
      </nav>
      <section className="main">
        <DBProvider authToken={currentUser.tokens.idToken}>
          <TodoList />
        </DBProvider>
      </section>
    </div>
  )

}

export default AppLayout