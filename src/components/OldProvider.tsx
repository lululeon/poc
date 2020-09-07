import { RxDocument, RxCollection, RxDatabase } from 'rxdb'
import React, { useEffect, useState, ReactNode} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { createDb } from '../persistenceOldVersion/Database'
import { GraphQLReplicator } from '../persistenceOldVersion/GraphQLReplicator'

export type TodoType = {
  id: string
  text: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string | null  // will need for scheduled hard-delete sweeps. Made optional bcos '' is not a valid date format
  userId: string
}

export type TodoUpdatePatch = {
  text: string
  isCompleted: boolean
}

// we declare static ORM-methods for the collection
export type TodoCollectionMethods = {
  countAllDocuments: () => Promise<number>
}

// and then merge all our types to define the collection
export type TodoCollection = RxCollection<TodoType, TodoMethods, TodoCollectionMethods>

// any orm methods go here
export type TodoMethods = {
  addendum: (v: string) => string
}

// merge orm methods into the base type
export type TodoDocument = RxDocument<TodoType, TodoMethods>

// the helper type containing all our collections
export type AppDatabaseCollections = {
  todos: TodoCollection
}

// now define the database
export type AppDatabase = RxDatabase<AppDatabaseCollections>

interface IDBActions {
  createTodo: (todoText: string) => Promise<void>,
  updateTodo: (todoId:string, todoPatch: any) => Promise<void>,
  deleteTodo: (todoId: string) => Promise<void>,
}

export const DBContext = React.createContext({
  todos: [] as TodoDocument[],
  replicating: false,
  actions: {} as IDBActions,
})


interface IDBProviderProps {
  userId: string
  authToken: string
  children: ReactNode
}

export const DBProvider = ({ children, userId, authToken }: IDBProviderProps) => {
  const [db, setDb] = useState<RxDatabase | undefined>(undefined)
  const [replicating, setReplicating] = useState<boolean>(false)
  const [todos, setTodos] = useState<TodoDocument[]>([])

  // 1. [] => hook has no depencies => not watching anything => can fire once only on mount.
  // 2. you mustn't make the useEffect itself async. But you CAN have it define an async and immediately call it.
  useEffect(() => {
    async function initIdb() {
      if (!db) {
        const theDb: RxDatabase = await createDb()
        setDb(theDb)
      } else {
        const theReplicator = new GraphQLReplicator(db)
        if (userId && authToken) {
          theReplicator.restart({ userId, authToken })
          setReplicating(true)
        }
      }
    }

    console.log('initialising db...')
    initIdb()
  }, [db, authToken, userId])

  useEffect(() => {
    async function initTodos() {
      if (db) {
        try {
          await db?.todos.find().sort('createdAt').$.subscribe((initialTodos => {
            // make sure we actually fetched sthg else will write undefined to our local state!
            if(!initialTodos) return

            // const pojoTodos = initialTodos.map(_ => _.toJSON())
            // console.log('*** local rxdb change: fetched todos!', pojoTodos)

            setTodos(initialTodos)
          }))
        } catch (error) {
          console.log('could not fetch initial todos from browser store!', error)
        }
      }
    }
    initTodos()
  }, [db])

  const deleteTodo = async (todoId: string) => {
    try {
      const theTodo = await db?.todos.findOne().where('id').eq(todoId).exec()
      await theTodo?.remove()
    } catch (error) {
      console.error('rxdb persistence failed.', error)
    }
    // setTodos(helper.remove(todos, todoId))
  }

  const createTodo = async (todoText: string) => {
    const ts = (new Date()).toISOString()
    const newTodo: TodoType = { id: uuidv4(), text: todoText, isCompleted: false, createdAt: ts, updatedAt: ts, userId, }
    try {
      await db?.todos.insert(newTodo)
    } catch (error) {
      console.error('rxdb persistence failed.', error)
    }
    // setTodos(helper.create(todos, newTodo))
  }

  const updateTodo = async (todoId:string, todoPatch: TodoUpdatePatch) => {
    // console.log('*** updateTodo:', todoId, todoPatch)

    // db?.todos.findOne().where('id').eq(todoId).exec()
    //   .then(theTodo => {
    //   console.log('*** updating this doc:', theTodo.toJSON())
    //   console.log('*** with patch:', { $set: todoPatch })
    //   theTodo?.update({ $set: todoPatch })
    //   // theTodo?.atomicUpdate({ $set: todoPatch })
    //   })
    //   .catch(error => console.error('rxdb persistence failed.', error))
  
    try {
      const theTodo = await db?.todos.findOne().where('id').eq(todoId).exec()

      if(!theTodo) throw new Error('item to be updated not found!')

      // console.log('*** updating this doc:', theTodo.toJSON())
      // console.log('*** with patch:', { $set: todoPatch })
      theTodo.update({ $set: todoPatch })
    } catch (error) {
      console.error('rxdb persistence failed.', error)
    }
    // setTodos(helper.update(todos, todoId, validPatch))
  }

  return (
    <DBContext.Provider
      value={{
        todos,
        replicating,
        actions: {
          createTodo,
          deleteTodo,
          updateTodo,
        },
      }}
    >
      {children}
    </DBContext.Provider>
  )
}
