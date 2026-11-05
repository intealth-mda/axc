import type { GenerateLayout } from './config.ts';
import type { FieldSpec, NestedSpec } from './spec.ts';

export interface GenerateFeatureOptions {
	root: string;
	lint: GenerateLayout;
	context: string;
	/** The `--subdomain` flag. Folder and type names still use this value. */
	entity: string;
	/** Omitted, `generate` writes the subdomain and no action. */
	action?: string;
	/** Set by the query and mutation commands. The action name stays whatever --name is. */
	operation?: 'query' | 'update' | 'extend';
	/** Command fields for a query or update. Aggregate fields stay on `fields`. */
	params?: FieldSpec[];
	transport?: 'rest' | 'graphql';
	/** Written through as the Promise result. Omitted, a query still returns the reference array. */
	result?: string;
	/** REST path name, or the GraphQL field name when transport is graphql. Omitted, REST uses the entity and GraphQL uses the action. */
	route?: string;
	/** REST verb. Omitted, a query is get and a write is post. */
	method?: 'get' | 'post' | 'patch' | 'put' | 'delete';
	fields?: FieldSpec[];
	permissions?: string[];
	nested?: NestedSpec[];
	resolver?: boolean;
}

export interface GeneratedFile {
	path: string;
	contents: string;
}
