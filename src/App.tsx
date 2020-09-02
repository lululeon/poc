import React from 'react'
import './App.css';
// import { DBProvider } from './components/DBProvider'
import AppLayout from './components/AppLayout'

// no types yet for this lib:
// import {
//   FeatherClient,
//   FeatherProvider,
// } from 'feather-client-react'
const FeatherClientReact = require('feather-client-react')
const FeatherClient = FeatherClientReact.FeatherClient
const FeatherProvider = FeatherClientReact.FeatherProvider


function App() {
  const authApiKey = process.env.REACT_APP_FEATHER_API_KEY
  const feather = FeatherClient(authApiKey)
  return (
    <div className="App">
      <FeatherProvider client={feather}>
        <AppLayout />
      </FeatherProvider>
    </div>
  )
}

export default App;
