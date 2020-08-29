import {
  createRxDatabase,
  RxDatabase,
  PouchDB,
} from 'rxdb'
import idb from 'pouchdb-adapter-idb'
import { todoSchema, TodoType, TodoMethods, TodoDocument, TodoCollection, TodoCollectionMethods } from './Schema'

// load plugins
PouchDB.plugin(idb)

// the helper type containing all our collections
export type AppDatabaseCollections = {
  todos: TodoCollection
}

// now define the database
export type AppDatabase = RxDatabase<AppDatabaseCollections>

export const createDb = async ():Promise<AppDatabase> => {
  // 1. create the database
  const appDb: AppDatabase = await createRxDatabase<AppDatabaseCollections>({
    name: 'mydb',
    adapter: 'idb'
  })

  // 2. create the schema. in our case we're importing it (see import of todoSchema) so can skip that step here.

  // 3. impl document methods
  const todoMethods: TodoMethods = {
    addendum: function(this: TodoDocument, what: string) {
      return `${this.text} oh and also ${what}`
    }
  }

  // 4. impl collection methods
  const todoCollectionMethods: TodoCollectionMethods = {
    countAllDocuments: async function(this: TodoCollection) {
      const allDocs = await this.find().exec()
      return allDocs.length
    }
  }

  // 5. create the collection
  await appDb.collection({
    name: 'todos',
    schema: todoSchema,
    methods: todoMethods,
    statics: todoCollectionMethods,

    // from docs: A migrationStrategy is a function which gets the old document-data as a parameter and 
    // returns the new, transformed document-data. If the strategy returns null, the document will be 
    // removed instead of migrated.
    migrationStrategies: {
      // 1 means, this transforms data from version 0 to version 1
      1: function(oldDoc: TodoDocument) {
        oldDoc.updatedAt = oldDoc.updatedAt === '' ? oldDoc.createdAt : oldDoc.updatedAt
        if(oldDoc.deleted) {
          oldDoc.deletedAt = oldDoc.updatedAt
        }
        return oldDoc;
      }
    }
  });

  // 6. hooks. eg post-insert:
  appDb.todos.postInsert(
    function myPostInsertHook(
        this: TodoCollection, // own collection is bound to the scope
        docData: TodoType, // documents data
        doc: TodoDocument // RxDocument
    ) {
      console.log('insert to ' + this.name + ' collection: ' + doc.text)
    },
    false // not async
  )

  // 7. return the database
  return appDb
}
