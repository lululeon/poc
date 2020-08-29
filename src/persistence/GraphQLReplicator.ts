import { addRxPlugin } from 'rxdb/plugins/core'
import { RxDBReplicationGraphQLPlugin, RxGraphQLReplicationState } from 'rxdb/plugins/replication-graphql'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { TodoDocument } from './Schema'
import { AppDatabase } from './Database'

addRxPlugin(RxDBReplicationGraphQLPlugin)

// not used at this time
interface AuthInfo {
  userId: string
  idToken: string
}

// hasura endpoint
const syncURL = process.env.REACT_APP_HASURA_ENDPOINT
const batchSize = process.env.REACT_APP_SYNC_BATCH_SIZE ? parseInt(process.env.REACT_APP_SYNC_BATCH_SIZE, 10) : 5

// this function is passed the last sync'ed document and is expected to return the next batch of documents.
// that means the serverside
// 1) must have a query which returns the latest docs for a given doc timestamp
// 2) the updated_at column needs to auto-update **SERVER-SIDE**, in the db, since that is the source of truth
const pullQueryBuilder = (userId: string) => {
  console.warn('< < < < PULLING!... ')

  return (doc:TodoDocument) => {
    let finalDoc = doc 
      ? doc
      : {
        id: '',
        updatedAt: new Date(0).toUTCString()
      }

    // oring in where clause:           // userId: {_eq: "${userId}"} 
    const query = `{
      todos(
        where: {
          _or: [
            {updatedAt: {_gt: "${finalDoc.updatedAt}"}},
            {
              updatedAt: {_eq: "${finalDoc.updatedAt}"},
              id: {_gt: "${finalDoc.id}"}
            }
          ]
        },
        limit: ${batchSize},
        order_by: [{updatedAt: asc}, {id: asc}]
      ) {
        id
        text
        isCompleted
        deleted
        createdAt
        updatedAt
      }
    }`

    return {
      query,
      variables: {}
    }
  }
}

// note: this is actually an upsert. Meaning if the id is NOT unique, doc with existing id will
// be overwritten
const pushQueryBuilder = (doc:TodoDocument) => {
  console.warn('>>>>>>>>>>>>>>>>>>>pushing... ', doc)
  const query = `
    mutation InsertTodo($todo: [todos_insert_input!]!) {
      insert_todos(
        objects: $todo,
        on_conflict: {
          constraint: todos_pkey,
          update_columns: [text, isCompleted, updatedAt]
        }
      ) {
        returning {
          id
        }
      }
    }
  `
  const variables = {
    todo: [doc]
  }

  return {
    query,
    variables
  }
}

export class GraphQLReplicator {
  private db: AppDatabase
  private replicationState: RxGraphQLReplicationState | null
  private subscriptionClient: SubscriptionClient | null
  private webSocketUrl: string

  constructor(db: AppDatabase) {
      this.db = db;
      this.replicationState = null
      this.subscriptionClient = null
      if(!syncURL) throw new Error('No sync url!!')
      this.webSocketUrl = syncURL.replace(/^https?/gi, 'ws')    
  }

  async restart(auth:AuthInfo) {
    if(this.replicationState) {
      this.replicationState.cancel()
    }
    if(this.subscriptionClient) {
      this.subscriptionClient.close()
    }
    this.replicationState = await this.setupGraphQLReplication(auth)
    this.subscriptionClient = this.setupGraphQLSubscription(auth, this.replicationState)
  }

  async setupGraphQLReplication(auth:AuthInfo) {
    const replicationState = this.db.todos.syncGraphQL({
      url: syncURL || '',
      // headers: {
      //   'Authorization': `Bearer ${auth.idToken}`
      // },
      push: {
        batchSize,
        queryBuilder: pushQueryBuilder
      },
      pull: {
        queryBuilder: pullQueryBuilder(auth.userId)
      },
      live: true,
      /**
      * Because the websocket is used to inform the client
      * when something has changed,
      * we can set the liveIntervall to a high value
      */
      liveInterval: 1000 * 60 * 10, // 10 minutes
      deletedFlag: 'deleted'
    })

    replicationState.error$.subscribe(err => {
      console.error('replication error:')
      console.dir(err)
    })
    return replicationState
  }
 
  setupGraphQLSubscription(auth:AuthInfo, replicationState:RxGraphQLReplicationState): SubscriptionClient {
    const wsClient = new SubscriptionClient(this.webSocketUrl, {
      reconnect: true,
      connectionParams: {
        // headers: {
        //   'Authorization': `Bearer ${auth.idToken}`
        // }
      },
      timeout: 1000 * 60,
      reconnectionAttempts: 10000, // when idle, check for new data every 10mins
      inactivityTimeout: 10 * 1000,
      lazy: true
    })

    wsClient.onConnected(():void => {
      console.log('SubscriptionClient.onConnected()')
    })

    wsClient.onError((error):void => {
      console.error('SubscriptionClient.onError:', error)
    })

    const query = `
      subscription onTodoChanged {
        todos {
          id
          deleted
          isCompleted
          text
        }       
      }
    `

    const ret = wsClient.request({ query })

    ret.subscribe({
      next(data) {
        console.log('subscription emitted => trigger run', data)
        console.dir(data)
        replicationState.run()
      },
      error(error) {
        console.log('got error:', error)
      }
    })

    return wsClient
  }    
}
