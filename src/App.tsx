import React from 'react'
import './App.css';
// import { DBProvider } from './components/DBProvider'
import AppLayout from './components/AppLayout'
import { Auth0Provider } from '@auth0/auth0-react'

function App() {
  const authDomain =  process.env.REACT_APP_AUTH0_DOMAIN || ''
  const authClientId = process.env.REACT_APP_AUTH0_CLIENT_ID || ''
  const authRedirectUri = process.env.REACT_APP_AUTH0_REDIR_URL || ''

  // scope - not needed. these are domain specific permission scopes, like read:emails , etc

  console.log('*** ENV :', authDomain, authClientId, authRedirectUri)

  return (
    <div className="App">
      <Auth0Provider
        domain={authDomain}
        clientId={authClientId}
        redirectUri={authRedirectUri}
      >
        <AppLayout />
      </Auth0Provider>
    </div>
  )
}

export default App;
