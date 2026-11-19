# `fn_timer_handler_<action>/index.ts`

Path: `<timer-operations>/fn_timer_handler_<action>/index.ts`

`<action>` in that folder uses `_` where the operation name uses `-`. Write this when the user asks for a timer. The action file already exists. This file calls that action. It does not open a unit of work of its own.

`createTimerHandler` is already exported from `<scope>/timer-handler`. Import it at `<api-composition>`. Do not write that wrapper again.

One permissions const, one schedule function, and one operation const. The operation is `TimerOperation<ApplicationServices>`. The barrel is [index.md](index.md).

```ts
import type { InvocationContext, Timer } from '@azure/functions';
import type { ApplicationServices, SystemPermissions } from '<scope>/application-services';
import type { TimerOperation } from '<scope>/timer-handler';

export const <actionCamel>Permissions = { <permission>: true } as const satisfies SystemPermissions;

export function <actionCamel>Schedule(): string {
	const schedule = process.env['<schedule-env>'];
	if (!schedule) {
		throw new Error('<schedule-env> is not defined');
	}
	return schedule;
}

export const <actionCamel>Operation: TimerOperation<ApplicationServices> = async (_timer: Timer, _context: InvocationContext, applicationServices: ApplicationServices): Promise<void> => {
	await applicationServices.<Context>.<Subdomain>.<actionCamel>({
		<field>: <field>,
	});
};
```

`<actionCamel>Schedule` reads one environment variable, the cron the user named, and throws when that variable is missing. `<actionCamel>Operation` receives the Azure Functions `Timer`, the `InvocationContext`, and the system application services. Pass each parameter the action already takes. An action with no input is called with no argument. The operation does not call `forSystem`.

## Consumption

`<api-composition>` is the file `apiComposition` names. It already builds the host and calls `initializeApplicationServices`. The timer consumes that same factory. `createTimerHandler` returns `(host) => (timer, context) => Promise<void>`. Call it with the factory the host passes in. That call is `forSystem(<actionCamel>Permissions)` inside the wrapper, then `<actionCamel>Operation`.

```ts
import { createTimerHandler } from '<scope>/timer-handler';
import { <actionCamel>Operation, <actionCamel>Permissions, <actionCamel>Schedule } from '<scope>/timer-operations';
```

```ts
(applicationServicesFactory) =>
	createTimerHandler({
		permissions: <actionCamel>Permissions,
		operation: <actionCamel>Operation,
	})(applicationServicesFactory)
```

`applicationServicesFactory` is the `ApplicationServicesFactory` from `initializeApplicationServices`. Do not construct a second factory. Do not call `forRequest`. A timer runs as the system.

## Registration

Add one `registerAzureFunctionTimerHandler` on that same chain, after `initializeApplicationServices` and before `startUp`. Do not replace the file. Do not drop a trigger already there. Do not call `app.timer` from the operation file.

```ts
.initializeApplicationServices((context) => buildApplicationServicesFactory(context.mongooseService))
.registerAzureFunctionTimerHandler('timerTrigger<Action>', { schedule: <actionCamel>Schedule() }, (applicationServicesFactory) =>
	createTimerHandler({
		permissions: <actionCamel>Permissions,
		operation: <actionCamel>Operation,
	})(applicationServicesFactory),
)
.startUp();
```

The first argument is the Azure Functions name: `timerTrigger` plus `<Action>`. `schedule` is the return of `<actionCamel>Schedule()`. The third argument is the consumption callback above.

## Host method

`registerAzureFunctionTimerHandler` lives on the class `<api-composition>` constructs, the one `initializeInfrastructureServices` is called on. Add the method when that class does not have it. Do not add it to `Cellix`. Match the queue method on that class: read `appServicesHostInternal`, throw `Application services are not ready` when it is missing, then call the creator with that factory.

```ts
public registerAzureFunctionTimerHandler(
	name: string,
	options: Omit<TimerFunctionOptions, 'handler'>,
	handlerCreator: (applicationServicesFactory: ApplicationServicesFactory, infrastructureRegistry: Cellix<ContextType, AppServices>) => TimerHandler,
): this {
	app.timer(name, {
		...options,
		handler: (timer, context) => {
			const applicationServicesFactory = (this as unknown as { appServicesHostInternal?: ApplicationServicesFactory }).appServicesHostInternal;
			if (!applicationServicesFactory) {
				throw new Error('Application services are not ready');
			}
			return handlerCreator(applicationServicesFactory, this)(timer, context);
		},
	});
	return this;
}
```

`TimerHandler` is `NonNullable<TimerFunctionOptions['handler']>`. `TimerFunctionOptions` comes from `@azure/functions`. A class that already has this method stays as it is.
