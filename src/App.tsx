import React from 'react';
import './App.css';
import { DBProvider } from './components/DBProvider'
import TodoList from './components/TodoList'

function App() {
  return (
    <div className="App">
      <p>
        Hello RxDB!!
      </p>
      <section>
      <DBProvider>
        <TodoList />
      </DBProvider>
      </section>
    </div>
  )
}

export default App;
