import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const LoginButton = () => {
  const {
    isAuthenticated,
    loginWithRedirect,
  } = useAuth0()

  if(!isAuthenticated) return (
    <button onClick={loginWithRedirect}>Log in</button>
  )
  return null
}

export default LoginButton
