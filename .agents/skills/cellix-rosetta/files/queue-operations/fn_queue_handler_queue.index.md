# `fn_queue_handler_<queue>/index.ts`

Path: `<queue-operations>/fn_queue_handler_<queue>/index.ts`

`<queue>` in that folder uses `_` where the queue name uses `-`. Write this when the user asks for a queue handler. The action file already exists. This file calls that action. It does not open a unit of work of its own.

`createQueueHandler` is already exported from `<scope>/queue-handler`. Import it at `<api-composition>`. Do not write that wrapper again.

One permissions const and one operation const. The operation is `QueueOperation<object, ApplicationServices>`. The barrel is [index.md](index.md).

```ts
import type { ApplicationServices, SystemPermissions } from '<scope>/application-services';
import type { QueueOperation } from '<scope>/queue-handler';

export const <actionCamel>Permissions = { <permission>: true } as const satisfies SystemPermissions;

export const <actionCamel>Operation: QueueOperation<object, ApplicationServices> = async (message, context, applicationServices) => {
	await applicationServices.<Context>.<Subdomain>.<actionCamel>({
		<field>: message.<field>,
	});
};
```

`message` is the queue body. `<field>` is a parameter the action already takes. Pass each one. Do not pass `message` itself when the action takes a command. `context` is the Azure Functions `InvocationContext`. `applicationServices` is the system scope from `createQueueHandler`. The operation does not call `forSystem`.

## Consumption

`<api-composition>` is the file `apiComposition` names. It already builds the host and calls `initializeApplicationServices`. The queue trigger consumes that same factory. `createQueueHandler` returns `(host) => (message, context) => Promise<void>`. Call it with the factory the host passes in. That call is `forSystem(<actionCamel>Permissions)` inside the wrapper, then `<actionCamel>Operation`.

```ts
import { createQueueHandler } from '<scope>/queue-handler';
import { <actionCamel>Operation, <actionCamel>Permissions } from '<scope>/queue-operations';
```

```ts
(appServicesFactory) =>
	createQueueHandler({
		permissions: <actionCamel>Permissions,
		operation: <actionCamel>Operation,
	})(appServicesFactory)
```

`appServicesFactory` is the `ApplicationServicesFactory` from `initializeApplicationServices`. Do not construct a second factory. Do not call `forRequest`. A queue runs as the system.

## Registration

Add one `registerAzureFunctionStorageQueueHandler` on that same chain, after `initializeApplicationServices` and before `startUp`. Do not replace the file. Do not drop a trigger already there. The method is already on the host class. Do not add it again.

```ts
.initializeApplicationServices((context) => buildApplicationServicesFactory(context.mongooseService))
.registerAzureFunctionStorageQueueHandler(
	'queueTrigger<Queue>',
	{ queueName: '<queue>', connection: 'QUEUE_STORAGE_URL' },
	(appServicesFactory) =>
		createQueueHandler({
			permissions: <actionCamel>Permissions,
			operation: <actionCamel>Operation,
		})(appServicesFactory),
)
.startUp();
```

The first argument is the Azure Functions name: `queueTrigger` plus `<Queue>`. `queueName` is the storage queue. `connection` stays `QUEUE_STORAGE_URL`. The third argument is the consumption callback above.

When the operation sets `context.extraOutputs`, add `extraOutputs` on that options object and export the output binding from the operation file. A handler that only calls the action leaves `extraOutputs` off.
