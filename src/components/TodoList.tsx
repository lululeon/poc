import React, {useContext, useState } from 'react'
import { DBContext } from './OldProvider'

const TodoList = () => {
  const [currentText, setCurrentText] = useState('')
  const { actions, todos, replicating } = useContext(DBContext)

  /* tslint:disable */
  const todoItems = todos ? todos.map(_ => (
    <div key={_.id} className="todobox">
      <input type="checkbox" checked={Boolean(_.isCompleted)} onChange={() => actions.updateTodo(_.id, { isCompleted: !(_.isCompleted) })} />
      {_.text}
      <span role="img" aria-label="delete" className="button" onClick={() => actions.deleteTodo(_.id)}>✖️</span>
    </div>
  )) : null

  // inputs not fully typed yet, so:
  // const handleTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
  const handleTextChange = (evt:any) => {
    evt.preventDefault()
    setCurrentText(evt.target.value)
  }

  const handleAdd = (evt: any) => {
    evt.preventDefault()
    actions.createTodo(currentText)
  }

  return (
    <div>
      <form>
        <label>What to do:</label><br />
        <input type="text" name="todoText" value={currentText} onChange={handleTextChange}/><br /><br />
        <button onClick={handleAdd}>Add</button>
      </form>
      {!replicating && <p>WARNING!! Replication is not working at the moment!</p>}
      {todoItems}
    </div>
    
  )
}

export default TodoList
