import React from 'react';
import logo from './logo.svg';
import './App.css';
import { DBProvider } from './components/DBProvider'
import TodoList from './components/TodoList'

function App() {
  return (
    <DBProvider>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Hello RxDB!!
          </p>
        </header>
        <section>
          <TodoList />
        </section>
      </div>
    </DBProvider>
  )
}

export default App;
