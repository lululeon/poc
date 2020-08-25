import {
  RxJsonSchema,
  RxDocument,
} from 'rxdb'


// the typescript-representation of the jsonschema of the collection
export type TodoType = {
  id: string
  text: string
  isCompleted: boolean
  createdAt: string
  updatedAt?: string
  // userId: string
}

// any orm methods go here
export type TodoMethods = {
  addendum: (v: string) => string
}

// merge orm methods into the base type
export type TodoDocument = RxDocument<TodoType, TodoMethods>

// the jsonschema of the collection
export const todoSchema: RxJsonSchema<TodoType> = {
  title: 'todo schema',
  description: 'todo schema',
  version: 0,
  type: 'object',
  properties: {
    id: {
      type: 'string',
      primary: true
    },
    text: {
      type: 'string'
    },
    isCompleted: {
      type: 'boolean'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      // index: true,   
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    },
    // userId: {
    //   type: 'string'
    // },
  },
  // required: ['text', 'isCompleted', 'userId', 'createdAt'],
  required: ['id', 'text', 'isCompleted', 'createdAt'],
  indexes: ['createdAt']
  // additionalProperties: true
}
