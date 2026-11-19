# Models package index

Path: `<models>/index.ts`

Add the factory to the builder that already exists. Add the type exports when the adapter imports them from `<scope>/data-sources-mongoose-models`. Do not replace the builder.

```ts
import { <Subdomain>ModelFactory } from './models/<subdomain>/<subdomain>.model.ts';

export type { <Subdomain>, <Subdomain>ModelType } from './models/<subdomain>/<subdomain>.model.ts';
export { <Subdomain>ModelName } from './models/<subdomain>/<subdomain>.model.ts';

export const mongooseContextBuilder = (initializedService: MongooseSeedwork.MongooseContextFactory) => {
	return {
		<Subdomain>: <Subdomain>ModelFactory(initializedService),
	};
};
```

A package that already imports models from `./models/<subdomain>.model.ts` uses that path for the new lines.
