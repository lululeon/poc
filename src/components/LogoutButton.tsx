import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const LogoutButton = () => {
  const {
    isAuthenticated,
    logout,
  } = useAuth0()

  if (isAuthenticated) return (
    <button onClick={() => {
      logout({ returnTo: window.location.origin })
    }}>Log out</button>
  )

  return null
}

export default LogoutButton
