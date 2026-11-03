import { pascal } from '../../names.ts';

export function feature(entity: string, action: string): string {
	const title = `${entity} ${action}`.replaceAll('-', ' ');
	return `Feature: ${pascal(entity)} ${pascal(action)}\n\n  Scenario: The client reads ${title} from the running application\n    When the client requests ${title}\n    Then ${title} responds with status 200\n`;
}

export function steps(entity: string, action: string, request?: { method: string; route: string }): string {
	const title = `${entity} ${action}`.replaceAll('-', ' ');
	const verb = requestVerb(request?.method);
	const route = request?.route ?? entity;
	return `import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, matches } from '@serenity-js/assertions';
import { type Answerable, actorCalled, Question } from '@serenity-js/core';
import { ${verb}Request, LastResponse, Send } from '@serenity-js/rest';

const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
const responseBody = Question.about('the response body', async (actor) => JSON.stringify(await actor.answer(LastResponse.body())));

When('the client requests ${title}', () => actorCalled('API client').attemptsTo(Send.a(${verb}Request.to('/api/${route}'))));

Then('${title} responds with status 200', () => actorCalled('API client').attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(200)), Ensure.that(responseBody, matches(/.+/))));
`;
}

function requestVerb(method: string | undefined): string {
	if (method === 'post') return 'Post';
	if (method === 'patch') return 'Patch';
	if (method === 'put') return 'Put';
	if (method === 'delete') return 'Delete';
	return 'Get';
}
