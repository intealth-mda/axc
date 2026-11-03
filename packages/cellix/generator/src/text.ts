import { isShapeNested, type ShapeField, type ShapeMember, type ShapeNested } from './shape.ts';
import type { FieldSpec } from './spec.ts';

const PASSTHROUGH = new Set(['null', 'undefined', 'object', 'unknown', 'any', 'void', 'never', 'bigint', 'symbol']);

export function tsType(type: string): string {
	const trimmed = type.trim();
	if (trimmed === 'boolean') return 'boolean';
	if (trimmed === 'date') return 'Date';
	if (trimmed === 'number') return 'number';
	if (trimmed === 'string' || trimmed === 'id') return 'string';
	if (PASSTHROUGH.has(trimmed)) return trimmed;
	if (trimmed.endsWith('[]')) return `${tsType(trimmed.slice(0, -2))}[]`;
	if (trimmed.includes('|')) {
		return trimmed
			.split('|')
			.map((part) => tsType(part))
			.join(' | ');
	}
	if (/^'[^']*'$/.test(trimmed) || /^"[^"]*"$/.test(trimmed)) return trimmed;
	if (/^[a-z][A-Za-z0-9]*$/.test(trimmed)) return `'${trimmed}'`;
	return trimmed;
}

export function mongooseField(field: ShapeField): string {
	if (field.type === 'boolean') return '{ type: Boolean, required: true }';
	if (field.type === 'date') return '{ type: Date, required: true }';
	if (field.type === 'number') return '{ type: Number, required: true }';
	if (field.type === 'string') return '{ type: String, required: true, minlength: 1, maxlength: 200 }';
	if (field.type.endsWith('[]')) return `{ type: [${mongooseScalar(field.type.slice(0, -2))}], required: true }`;
	return '{ type: String, required: true }';
}

export function gqlType(type: string): string {
	if (type.endsWith('[]')) return `[${gqlType(type.slice(0, -2)).replace(/!$/, '')}!]!`;
	if (type === 'boolean') return 'Boolean!';
	if (type === 'number') return 'Float!';
	if (type === 'date') return 'DateTime!';
	if (type === 'string' || type === 'id') return 'String!';
	return 'String!';
}

export function serviceResult(input: { result?: string | undefined; operation?: 'query' | 'update' | 'extend' | undefined; kind: ActionKind; actionCamel: string; reference: string }): string {
	if (input.result) return input.result;
	if (input.operation === 'query' || input.kind === 'read') {
		if (input.operation !== 'query' && /^get(?:[A-Z]|$)/.test(input.actionCamel)) return `${input.reference} | null`;
		return `${input.reference}[]`;
	}
	return input.reference;
}

/** REST uses the route as the path name. GraphQL uses it as the field name. */
export function graphqlFieldName(actionCamel: string, transport: 'rest' | 'graphql' | undefined, route: string | undefined): string {
	if (transport === 'graphql' && route) return route;
	return actionCamel;
}

export function namespacePath(contextPascal: string, entityPascal: string): string {
	return `${contextPascal}.${entityPascal}.${entityPascal}`;
}

export function nestedPropType(item: ShapeNested): string {
	return item.kind === 'entity' ? `PropArray<${item.pascal}Props>` : `${item.pascal}Props`;
}

export function propLines(members: ShapeMember[]): string {
	return members.map((member) => (isShapeNested(member) ? `\t${member.camel}: ${nestedPropType(member)};` : `\t${member.name}: ${tsType(member.type)};`)).join('\n');
}

export function structuralType(item: ShapeNested): string {
	const parts = item.fields.map((member) => (isShapeNested(member) ? `${member.camel}: ${structuralType(member)}` : `${member.name}: ${tsType(member.type)}`));
	return `{ ${parts.join('; ')} }`;
}

export type ActionKind = 'create' | 'update' | 'delete' | 'read';

export function actionKind(actionCamel: string): ActionKind {
	if (/^create(?:[A-Z]|$)/.test(actionCamel)) return 'create';
	if (/^update(?:[A-Z]|$)/.test(actionCamel)) return 'update';
	if (/^delete(?:[A-Z]|$)/.test(actionCamel)) return 'delete';
	return 'read';
}

/** The query and update commands choose the flow. The function name does not. */
export function assertOperationName(actionCamel: string, operation: 'query' | 'update'): void {
	if (operation === 'query' && /^(?:create|update|delete)(?:[A-Z]|$)/.test(actionCamel)) {
		throw new Error(`Query name ${actionCamel} is reserved for a mutation. Use the update command, or pick another name.`);
	}
	if (operation === 'update' && /^(?:query|get|find)(?:[A-Z]|$)/.test(actionCamel)) {
		throw new Error(`Update name ${actionCamel} is reserved for a read. Use the query command, or pick another name.`);
	}
}

export function paramShape(params: FieldSpec[]): { fields: ShapeField[]; nested: ShapeNested[] } {
	return {
		fields: mergeParams(params).map((field) => ({
			name: field.name,
			pascal: field.name,
			type: field.type === 'id' ? 'string' : field.type,
			...(field.optional ? { optional: true } : {}),
		})),
		nested: [],
	};
}

export function mergeParams(params: FieldSpec[]): FieldSpec[] {
	const merged: FieldSpec[] = [];
	for (const field of params) {
		const existing = merged.find((item) => item.name === field.name);
		if (!existing) {
			merged.push({ name: field.name, type: field.type, ...(field.optional ? { optional: true } : {}) });
			continue;
		}
		if (field.optional) existing.optional = true;
		if (existing.type === field.type) continue;
		existing.type = `${existing.type}|${field.type}`;
	}
	return merged;
}

function commandLine(field: ShapeField, optional: boolean): string {
	return `${field.name}${optional || field.optional ? '?' : ''}: ${tsType(field.type)};`;
}

export function commandFields(shape: { fields: ShapeField[]; nested: ShapeNested[] }, kind: ActionKind): string {
	const nested = shape.nested.filter((item) => item.kind !== 'entity');
	const lines = (optional: boolean) => [...shape.fields.map((field) => commandLine(field, optional)), ...nested.map((item) => `${item.camel}${optional ? '?' : ''}: ${structuralType(item)};`)];
	if (kind === 'read') return (lines(true).length > 0 ? lines(true) : ['id: string;']).join('\n\t');
	if (kind === 'update') {
		const extras = shape.fields.filter((field) => field.name !== 'id');
		return ['id: string;', ...extras.map((field) => commandLine(field, false)), ...nested.map((item) => `${item.camel}: ${structuralType(item)};`)].join('\n\t');
	}
	return lines(false).join('\n\t');
}

/** `:param` stays in the Hono path. Azure registrations use `{param}`. */
export function azureRoute(route: string): string {
	return route.replace(/:([A-Za-z][A-Za-z0-9-]*)/g, '{$1}');
}

/** A query defaults to get. A write defaults to post. `--method` wins. */
export function httpMethod(input: { method?: string | undefined; operation?: 'query' | 'update' | 'extend' | undefined; kind: ActionKind }): string {
	if (input.method) return input.method;
	if (input.operation === 'query' || input.kind === 'read') return 'get';
	return 'post';
}

export function mutationArgument(route: string): string {
	const params = routeParamNames(route);
	if (params.length === 0) return 'await c.req.json()';
	const spread = params.map((name) => `${name}: c.req.param('${name}') ?? ''`).join(', ');
	return `{ ...await c.req.json(), ${spread} }`;
}

/** Relative import of src/models-context.ts from a file under src/. */
export function persistenceModelsImport(depth: number): string {
	return `${'../'.repeat(depth)}models-context.ts`;
}

export function httpReadArgument(shape: { fields: ShapeField[]; nested: ShapeNested[] }, route = ''): string {
	const pathParams = new Set(routeParamNames(route));
	const parts = [
		...routeParamNames(route)
			.filter((name) => !shape.fields.some((field) => field.name === name))
			.map((name) => `${name}: c.req.param('${name}') ?? ''`),
		...shape.fields.map((field) => (pathParams.has(field.name) ? `${field.name}: c.req.param('${field.name}') ?? ''` : httpSpread(field))),
		...shape.nested.filter((item) => item.kind !== 'entity').map((item) => `${item.camel}: {} as ${structuralType(item)}`),
	];
	if (parts.length === 0) return "{ id: c.req.query('id') ?? '' }";
	return `{ ${parts.join(', ')} }`;
}

function routeParamNames(route: string): string[] {
	return [...route.matchAll(/:([A-Za-z][A-Za-z0-9-]*)/g)].map((match) => match[1] ?? '').filter((name) => name.length > 0);
}

function mongooseScalar(type: string): string {
	if (type === 'boolean') return 'Boolean';
	if (type === 'date') return 'Date';
	if (type === 'number') return 'Number';
	return 'String';
}

function httpSpread(field: ShapeField): string {
	const raw = `c.req.query('${field.name}')`;
	if (field.type === 'boolean') return `...(${raw} === undefined ? {} : { ${field.name}: ${raw} === 'true' })`;
	if (field.type === 'number') return `...(${raw} === undefined ? {} : { ${field.name}: Number(${raw}) })`;
	if (field.type === 'date') return `...(${raw} === undefined ? {} : { ${field.name}: new Date(${raw}) })`;
	return `...(${raw} === undefined ? {} : { ${field.name}: ${raw} })`;
}
