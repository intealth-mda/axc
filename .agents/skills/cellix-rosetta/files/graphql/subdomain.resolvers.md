# `<subdomain>.resolvers.ts`

Path: `<graphql>/<subdomain>.resolvers.ts`

Write this beside `<subdomain>.graphql` when the user asks for GraphQL. When `<graphql>` ends in `schema/types`, import `Resolvers` and the input type from `../builder/generated.ts`. The context type is `GraphContext<ApplicationServices>`.

```ts
import type { Domain } from '<scope>/domain';
import type { ApplicationServices } from '<scope>/application-services';
import type { <Subdomain><Action>Input, Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

type <Subdomain>Context = GraphContext<ApplicationServices>;

const <Subdomain>MutationResolver = async (get<Subdomain>: Promise<Domain.Contexts.<Context>.<Subdomain>.<Subdomain>EntityReference>) => {
	try {
		return {
			status: { success: true },
			<subdomainCamel>: await get<Subdomain>,
		};
	} catch (error) {
		console.error('<Subdomain> > Mutation  : ', error);
		const { message } = error as Error;
		return {
			status: { success: false, errorMessage: message },
		};
	}
};

const <subdomainCamel>Resolvers: Resolvers<<Subdomain>Context> = {
	Query: {
		<subdomainCamel>ById: async (_parent, args: { id: string }, context: <Subdomain>Context) => {
			return await context.applicationServices.<Context>.<Subdomain>.queryById({ id: args.id });
		},
	},
	Mutation: {
		<actionCamel>: async (_parent, args: { input: <Subdomain><Action>Input }, context: <Subdomain>Context) => {
			return await <Subdomain>MutationResolver(
				context.applicationServices.<Context>.<Subdomain>.<actionCamel>({
					<field>: args.input.<field>,
				}),
			);
		},
	},
};

export default <subdomainCamel>Resolvers;
```

Pass each create-input field as `args.input.<field>`. Omit an entity collection. The mutation helper stays one function per file. Add the next mutation field beside `<actionCamel>`.

A query field passes `args.input` through and does not use the mutation helper.

```ts
<actionCamel>: async (_parent, args, context: <Subdomain>Context) => {
	return await context.applicationServices.<Context>.<Subdomain>.<actionCamel>(args.input);
},
```

When `<graphql>` does not end in `schema/types`, import `{ GraphContext, Resolvers }` from `./context.ts`, type the resolvers as `Resolvers`, and drop the `<Subdomain>Context` alias.
