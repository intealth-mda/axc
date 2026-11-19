# Add a timer operation

Add one command the user named onto a subdomain that already exists, and run it from a timer trigger. `query-by-id` is part of [New subdomain](new-subdomain.md). This workflow does not rebuild the aggregate. It does not write a GraphQL field.

1. Read [action.md](../files/application-services/action.md) and write `<action>.ts`. The path is in [file-tree.md](../file-tree.md) under Application service.
2. Read [fn_timer_handler_action.index.md](../files/timer-operations/fn_timer_handler_action.index.md). Write the operation file and add its export on the timer-operations barrel.
3. On `<api-composition>`, consume that operation with `createTimerHandler` and register it with `registerAzureFunctionTimerHandler`. Add that host method only when the class `<api-composition>` constructs does not already have it.
