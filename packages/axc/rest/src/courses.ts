import type { CoursePage, CourseSearchCommand, CourseSort } from '@axc/application-services';
import { courseModalities, courseStatuses } from '@axc/domain';
import type { Context } from 'hono';

const allowedParameters = ['q', 'modality', 'status', 'tag', 'page', 'pageSize', 'sort'] as const;
const sorts = ['title', 'createdAt', 'updatedAt'] as const;

export interface QueryParameterDetail {
	field: string;
	message: string;
}

export interface InvalidQueryResponse {
	error: {
		code: 'INVALID_QUERY_PARAMETER';
		message: 'One or more query parameters are invalid.';
		details: QueryParameterDetail[];
	};
}

export type ParsedCourseQuery = { ok: true; command: CourseSearchCommand } | { ok: false; response: InvalidQueryResponse };

function invalid(details: QueryParameterDetail[]): ParsedCourseQuery {
	return {
		ok: false,
		response: {
			error: {
				code: 'INVALID_QUERY_PARAMETER',
				message: 'One or more query parameters are invalid.',
				details,
			},
		},
	};
}

function singleValue(values: string[] | undefined, field: string, details: QueryParameterDetail[]): string | undefined {
	if (values === undefined) {
		return undefined;
	}
	if (values.length !== 1) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	const value = values[0];
	if (value === undefined) {
		details.push({ field, message: `${field} must be provided once.` });
		return undefined;
	}
	return value.trim();
}

function readInteger(raw: string | undefined, field: 'page' | 'pageSize', details: QueryParameterDetail[]): number | undefined {
	if (raw === undefined) {
		return undefined;
	}
	if (!/^[1-9]\d*$/.test(raw)) {
		details.push({
			field,
			message: field === 'pageSize' ? 'pageSize must be between 1 and 50.' : 'page must be an integer greater than or equal to 1.',
		});
		return undefined;
	}
	const parsed = Number(raw);
	if (field === 'pageSize' && parsed > 50) {
		details.push({ field, message: 'pageSize must be between 1 and 50.' });
		return undefined;
	}
	return parsed;
}

export function parseCourseSearchQuery(queries: Record<string, string[]>): ParsedCourseQuery {
	const details: QueryParameterDetail[] = [];
	for (const field of Object.keys(queries).sort()) {
		if (!(allowedParameters as readonly string[]).includes(field)) {
			details.push({ field, message: `${field} is not a supported query parameter.` });
		}
	}

	const q = singleValue(queries['q'], 'q', details);
	const modality = singleValue(queries['modality'], 'modality', details);
	const status = singleValue(queries['status'], 'status', details);
	const tag = singleValue(queries['tag'], 'tag', details);
	const page = readInteger(singleValue(queries['page'], 'page', details), 'page', details);
	const pageSize = readInteger(singleValue(queries['pageSize'], 'pageSize', details), 'pageSize', details);
	const sortRaw = singleValue(queries['sort'], 'sort', details);

	if (modality !== undefined && !(courseModalities as readonly string[]).includes(modality)) {
		details.push({ field: 'modality', message: 'modality must be one of online, in-person, hybrid.' });
	}
	if (status !== undefined && !(courseStatuses as readonly string[]).includes(status)) {
		details.push({ field: 'status', message: 'status must be one of draft, active, retired.' });
	}
	if (tag !== undefined && tag.length === 0) {
		details.push({ field: 'tag', message: 'tag must be a non-empty string.' });
	}
	let sort: CourseSort | undefined;
	if (sortRaw !== undefined && !(sorts as readonly string[]).includes(sortRaw)) {
		details.push({ field: 'sort', message: 'sort must be one of title, createdAt, updatedAt.' });
	} else if (sortRaw === 'title' || sortRaw === 'createdAt' || sortRaw === 'updatedAt') {
		sort = sortRaw;
	}

	if (details.length > 0) {
		return invalid(details);
	}

	const command: CourseSearchCommand = {
		page: page ?? 1,
		pageSize: pageSize ?? 10,
		sort: sort ?? 'title',
	};
	if (q !== undefined && q.length > 0) {
		command.q = q;
	}
	if (modality !== undefined) {
		command.modality = modality;
	}
	if (status !== undefined) {
		command.status = status;
	}
	if (tag !== undefined) {
		command.tag = tag;
	}
	return { ok: true, command };
}

export async function courseSearchResponse(c: Context, search: (command: CourseSearchCommand) => Promise<CoursePage>): Promise<Response> {
	const parsed = parseCourseSearchQuery(c.req.queries());
	if (!parsed.ok) {
		return c.json(parsed.response, 400);
	}
	return c.json(await search(parsed.command));
}
