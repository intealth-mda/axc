# Add a GraphQL operation

Add one command the user named onto a subdomain that already exists, and expose it as a GraphQL operation. `query-by-id` is part of [New subdomain](new-subdomain.md). This workflow does not rebuild the aggregate. It does not write a queue handler or a timer.

1. Read [action.md](../files/application-services/action.md) and write `<action>.ts`. The path is in [file-tree.md](../file-tree.md) under Application service.
2. Read [subdomain.graphql.md](../files/graphql/subdomain.graphql.md) and [subdomain.resolvers.md](../files/graphql/subdomain.resolvers.md). Add the GraphQL field on the schema and the resolver that already exist.
