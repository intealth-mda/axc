import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { getTimeout } from '@cellix/serenity-framework/settings';
import { AfterStep, type IWorld, Status } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { LastResponse } from '@serenity-js/rest';
import { infrastructure } from './infrastructure.ts';
import type { AgentCoursesApiWorld } from './world.ts';

/** Register the Cucumber Before/After/AfterAll hooks for the API acceptance suite. */
export function registerLifecycleHooks(): void {
	registerWorldLifecycleHooks<IWorld & AgentCoursesApiWorld>({
		scenarioTimeout: getTimeout('scenario'),
		before: async (world) => {
			await world.init();
		},
		after: async (world) => {
			await world.cleanup();
		},
		afterAll: () => infrastructure.stopAll(),
	});
	AfterStep(async (step) => {
		if (step.result?.status !== Status.FAILED) return;
		try {
			const actor = actorCalled('API client');
			const status = await actor.answer(LastResponse.status());
			const body = await actor.answer(LastResponse.body());
			const text = JSON.stringify(body);
			const clipped = text.length > 500 ? `${text.slice(0, 500)}…` : text;
			console.error(`Acceptance failure body: status=${String(status)} body=${clipped}`);
		} catch {
			// The failed step had no HTTP response.
		}
	});
}
