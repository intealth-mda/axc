# Add a queue operation

Add one command the user named onto a subdomain that already exists, and run it from a storage-queue trigger. `query-by-id` is part of [New subdomain](new-subdomain.md). This workflow does not rebuild the aggregate. It does not write a GraphQL field.

1. Read [action.md](../files/application-services/action.md) and write `<action>.ts`. The path is in [file-tree.md](../file-tree.md) under Application service.
2. Read [fn_queue_handler_queue.index.md](../files/queue-operations/fn_queue_handler_queue.index.md). Write the operation file and add its export on the queue-operations barrel.
3. On `<api-composition>`, consume that operation with `createQueueHandler` and register it with `registerAzureFunctionStorageQueueHandler`. The host method already exists. Do not add it again.
