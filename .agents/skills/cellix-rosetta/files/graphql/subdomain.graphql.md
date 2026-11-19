# `<subdomain>.graphql`

Path: `<graphql>/<subdomain>.graphql`

`<graphql>` is the layer path from `factory.json`. Write this when the user asks for GraphQL. A new subdomain that includes a create mutation also adds `<subdomainCamel>ById`.

`string` and ObjectId storage are `String!`. `boolean` is `Boolean!`. `number` is `Float!`. `date` is `DateTime!`. `string[]` is `[String!]!`. A `string | null` prop is still `String!`. A value object is `<Subdomain><Nested>!`. An entity and a value-array are `[<Subdomain><Nested>!]!`.

Each nested block is its own `type` and `input`. The create input includes root scalars and value objects. It does not include an entity collection.

```graphql
type <Subdomain><Nested> {
	<field>: String!
	<child>: [<Subdomain><Child>!]!
}

input <Subdomain><Nested>Input {
	<field>: String!
	<child>: [<Subdomain><Child>Input!]!
}

type <Subdomain><Child> {
	id: ID!
	<field>: String!
}

input <Subdomain><Child>Input {
	<field>: String!
}

type <Subdomain> {
	id: ID!
	schemaVersion: String!
	createdAt: DateTime!
	updatedAt: DateTime!
	<field>: String!
	<nested>: <Subdomain><Nested>!
}

input <Subdomain><Action>Input {
	<field>: String!
	<nested>: <Subdomain><Nested>Input!
}

type <Subdomain>MutationResult implements MutationResult {
	status: MutationStatus!
	<subdomainCamel>: <Subdomain>
}

extend type Query {
	<subdomainCamel>ById(id: ID!): <Subdomain>
}

extend type Mutation {
	<actionCamel>(input: <Subdomain><Action>Input!): <Subdomain>MutationResult!
}
```

A later query adds its input, a result type, and one field on the existing `extend type Query`. A later mutation adds one field on `extend type Mutation` and reuses `<Subdomain>MutationResult`. Do not duplicate a field that is already there.

```graphql
input <Subdomain><Action>Input {
	<field>: String
}

type <Subdomain><Action>Result {
	id: ID!
}

extend type Query {
	<actionCamel>(input: <Subdomain><Action>Input!): <Subdomain><Action>Result!
}
```
