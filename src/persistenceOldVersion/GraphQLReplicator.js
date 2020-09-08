import RxDB from 'rxdb'
import RxDBReplicationGraphQL from 'rxdb/plugins/replication-graphql'
import { SubscriptionClient } from 'subscriptions-transport-ws'

RxDB.plugin(RxDBReplicationGraphQL)

// Replace the below with the url to your hasura GraphQL API
const syncURL = process.env.REACT_APP_HASURA_ENDPOINT
const batchSize = process.env.REACT_APP_SYNC_BATCH_SIZE ? parseInt(process.env.REACT_APP_SYNC_BATCH_SIZE, 10) : 5

const pullQueryBuilder = () => {
  return (doc) => {
        if (!doc) {
            doc = {
                id: '',
                updatedAt: new Date(0).toUTCString()
            }
        }
        const query = `{
            todos(
                where: {
                    _or: [
                        {updatedAt: {_gt: "${doc.updatedAt}"}},
                        {
                            updatedAt: {_eq: "${doc.updatedAt}"},
                            id: {_gt: "${doc.id}"}
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
                userId
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

const pushQueryBuilder = doc => {
  const gqlDoc = { ...doc }
  delete gqlDoc.userId

    const query = `
        mutation InsertTodo($todo: [todos_insert_input!]!) {
            insert_todos(
                objects: $todo,
                on_conflict: {
                    constraint: todos_pkey,
                    update_columns: [text, isCompleted, deleted]
                }){
                returning {
                  id
                }
              }
       }
    `
    const variables = {
        todo: gqlDoc
    }
    return {
        query,
        variables
    }
}

export class GraphQLReplicator {
    constructor(db) {
        this.db = db
        this.replicationState = null
        this.subscriptionClient = null      
    }
    async restart(authToken) {
        if(this.replicationState) {
            this.replicationState.cancel()
        }
        if(this.subscriptionClient) {
            this.subscriptionClient.close()
        }
        this.replicationState = await this.setupGraphQLReplication(authToken)
        this.subscriptionClient = this.setupGraphQLSubscription(authToken, this.replicationState)
    }
    async setupGraphQLReplication(authToken) {
        const replicationState = this.db.todos.syncGraphQL({
           url: syncURL,
           headers: {
               'Authorization': `Bearer ${authToken}`
           },
           push: {
               batchSize,
               queryBuilder: pushQueryBuilder
           },
           pull: {
               queryBuilder: pullQueryBuilder()
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
   
    setupGraphQLSubscription(authToken, replicationState) {
        // Change this url to point to your hasura graphql url
        // note!! if in prod and using https, this has to be 'wss' protocol not 'ws'!!
        const endpointURL = syncURL.replace(/^https?/gi, 'wss')

        const wsClient = new SubscriptionClient(endpointURL, {
            reconnect: true,
            connectionParams: {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            },
            timeout: 1000 * 60,
            onConnect: () => {
                console.log('SubscriptionClient.onConnect()')
            },
            connectionCallback: () => {
                console.log('SubscriptionClient.connectionCallback:')
            },
            reconnectionAttempts: 10000,
            inactivityTimeout: 10 * 1000,
            lazy: true
        })
    
        const query = `subscription onTodoChanged {
          todos {
            id
            deleted
            isCompleted
            text
          }       
        }`
    
        const ret = wsClient.request({ query })
    
        ret.subscribe({
            next(data) {
                replicationState.run()
            },
            error(error) {
                console.log('got error:')
                console.dir(error)
            }
        })
    
        return wsClient
    }    
}
