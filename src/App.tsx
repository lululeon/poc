import React from 'react'
import './App.css'
// import { DBProvider } from './components/DBProvider'
import AppLayout from './components/AppLayout'
import { Auth0Provider } from '@auth0/auth0-react'

// no types yet for this lib:
// import {
//   FeatherClient,
//   FeatherProvider,
// } from 'feather-client-react'
// const FeatherClientReact = require('feather-client-react')
// const FeatherClient = FeatherClientReact.FeatherClient
// const FeatherProvider = FeatherClientReact.FeatherProvider


function App() {
  // const authApiKey = process.env.REACT_APP_FEATHER_API_KEY
  // const feather = FeatherClient(authApiKey)
  console.log('*** redir uri is ', process.env.REACT_APP_BASE_URL)
  return (
    <div className="App">
      <Auth0Provider 
        domain={process.env.REACT_APP_AUTH0_DOMAIN || ''}
        clientId={process.env.REACT_APP_AUTH0_CLIENT_ID || ''}
        redirectUri={process.env.REACT_APP_BASE_URL}>
        <AppLayout />
      </Auth0Provider>
    </div>
  )
}

export default App
