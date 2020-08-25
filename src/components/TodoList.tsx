import React, {useContext, useState } from 'react'
import { DBContext } from './DBProvider'

const TodoList = () => {
  const [currentText, setCurrentText] = useState('')
  const { actions, todos } = useContext(DBContext)

  const todoItems = todos ? todos.map(_ => (
    <div key={_.id} className="todobox">
      <input type="checkbox" onClick={() => actions.updateTodo(_.id, { isCompleted: !(_.isCompleted) })} />
      {_.text}
    </div>
  )) : null

  // inputs not fully typed yet, so:
  // const handleTextChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
  const handleTextChange = (evt:any) => {
    evt.preventDefault()
    setCurrentText(evt.target.value)
  }

  return (
    <div>
      <form>
        <label>What to do:</label><br />
        <input type="text" name="todoText" value={currentText} onChange={handleTextChange}/><br /><br />
        <button onClick={() => actions.createTodo(currentText)}>Add</button>
      </form>
      {todoItems}
    </div>
    
  )
}

export default TodoList
