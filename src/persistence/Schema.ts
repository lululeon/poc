import {
  RxJsonSchema,
  RxDocument,
  RxCollection,
} from 'rxdb'


// the typescript-representation of the jsonschema of the collection
export type TodoType = {
  id: string
  text: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
  // deleted?: boolean // rxdb / pouch seems to want full control of this attr. Can't have it as a top-lvl attr.
  deletedAt?: string | null  // will need for scheduled hard-delete sweeps. Made optional bcos '' is not a valid date format
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
  version: 1,
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
    // looks like rxdb directly controls this attribute, so can't also define it here. But, will prolly
    // still need it pgsql-side.
    // deleted: {
    //   type: 'boolean'
    // },
    deletedAt: {
      type: 'string',
      format: 'date-time'
    },
    // userId: {
    //   type: 'string'
    // },
  },
  // required: ['text', 'isCompleted', 'userId', 'createdAt'],
  required: ['id', 'text', 'isCompleted', 'createdAt', 'updatedAt'],
  indexes: ['createdAt']
  // additionalProperties: true
}


// we declare static ORM-methods for the collection
export type TodoCollectionMethods = {
  countAllDocuments: () => Promise<number>
}

// and then merge all our types to define the collection
export type TodoCollection = RxCollection<TodoType, TodoMethods, TodoCollectionMethods>
