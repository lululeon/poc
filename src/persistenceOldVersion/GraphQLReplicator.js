import RxDB from 'rxdb'
import RxDBReplicationGraphQL from 'rxdb/plugins/replication-graphql';
import { SubscriptionClient } from 'subscriptions-transport-ws';

RxDB.plugin(RxDBReplicationGraphQL);

// Replace the below with the url to your hasura GraphQL API
const syncURL = process.env.REACT_APP_HASURA_ENDPOINT
const batchSize = process.env.REACT_APP_SYNC_BATCH_SIZE ? parseInt(process.env.REACT_APP_SYNC_BATCH_SIZE, 10) : 5

const pullQueryBuilder = (userId) => {
    return (doc) => {
        if (!doc) {
            doc = {
                id: '',
                updatedAt: new Date(0).toUTCString()
            };
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
                createdAt
                updatedAt
            }
        }`;
        return {
            query,
            variables: {}
        };
    };
};
const pushQueryBuilder = doc => {
    const query = `
        mutation InsertTodo($todo: [todos_insert_input!]!) {
            insert_todos(
                objects: $todo,
                on_conflict: {
                    constraint: todos_pkey,
                    update_columns: [text, isCompleted, deleted, updatedAt]
                }){
                returning {
                  id
                }
              }
       }
    `;
    const variables = {
        todo: doc
    };
    return {
        query,
        variables
    };
};
export class GraphQLReplicator {
    constructor(db) {
        this.db = db;
        this.replicationState = null;
        this.subscriptionClient = null;      
    }
    async restart(auth) {
        if(this.replicationState) {
            this.replicationState.cancel()
        }
        if(this.subscriptionClient) {
            this.subscriptionClient.close()
        }
        this.replicationState = await this.setupGraphQLReplication(auth)
        this.subscriptionClient = this.setupGraphQLSubscription(auth, this.replicationState)
    }
    async setupGraphQLReplication(auth) {
        const replicationState = this.db.todos.syncGraphQL({
           url: syncURL,
           headers: {
               'Authorization': `Bearer ${auth.idToken}`
           },
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
       });
   
       replicationState.error$.subscribe(err => {
           console.error('replication error:');
           console.dir(err);
       });
       return replicationState;
    }
   
    setupGraphQLSubscription(auth, replicationState) {
        // Change this url to point to your hasura graphql url
        const endpointURL = syncURL.replace(/^https?/gi, 'ws');
        const wsClient = new SubscriptionClient(endpointURL, {
            reconnect: true,
            connectionParams: {
                // headers: {
                //     'Authorization': `Bearer ${auth.idToken}`
                // }
            },
            timeout: 1000 * 60,
            onConnect: () => {
                console.log('SubscriptionClient.onConnect()');
            },
            connectionCallback: () => {
                console.log('SubscriptionClient.connectionCallback:');
            },
            reconnectionAttempts: 10000,
            inactivityTimeout: 10 * 1000,
            lazy: true
        });
    
        const query = `subscription onTodoChanged {
            todos {
                id
                deleted
                isCompleted
                text
            }       
        }`;
    
        const ret = wsClient.request({ query });
    
        ret.subscribe({
            next(data) {
                console.log('subscription emitted => trigger run');
                console.dir(data);
                replicationState.run();
            },
            error(error) {
                console.log('got error:');
                console.dir(error);
            }
        });
    
        return wsClient
    }    
}
