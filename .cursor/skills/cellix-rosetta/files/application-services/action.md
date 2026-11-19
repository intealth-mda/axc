# `<action>.ts`

Path: `<application-services>/contexts/<context>/<subdomain>/<action>.ts`

Write this only when the user names an operation. One command interface and one const. The const is an arrow factory. Do not use the word `function`.

A query command makes every parameter optional (`<field>?: string`). The body calls the read repository. The result is `EntityReference[]`, unless the name starts with `get` and this is not the `query` operation, in which case it is `EntityReference | null`. Add the same method on the read repository with `return Promise.reject(new Error('not implemented'))`. A query name must not start with `create`, `update`, or `delete`.

```ts
return await dataSources.readonlyDataSource.<Context>.<Subdomain>.<Subdomain>ReadRepo.<actionCamel>(command.<field>);
```

An update command is `id: string` plus the parameters. An update name must not start with `query`, `get`, or `find`.

```ts
try {
	let updated: Domain.Contexts.<Context>.<Subdomain>.<Subdomain>EntityReference | undefined;
	await dataSources.domainDataSource.<Context>.<Subdomain>.<Subdomain>UnitOfWork.withScopedTransaction(async (repo) => {
		const current = await repo.getById(command.id);
		if (!current) {
			throw Object.assign(new Error('Unable to update <Subdomain>'), { status: 404 });
		}
		// assign the command onto current. A rejected change throws Object.assign(new Error('...'), { status: 409 })
		updated = await repo.save(current);
	});
	if (!updated) {
		throw Object.assign(new Error('Unable to update <Subdomain>'), { status: 404 });
	}
	return updated;
} catch (error) {
	if (typeof error === 'object' && error !== null && 'status' in error) throw error;
	throw Object.assign(error instanceof Error ? error : new Error('Unable to save <Subdomain>'), { status: 400 });
}
```

A create action uses the same try/catch. The inner return passes root scalars from `command`:

```ts
return await dataSources.domainDataSource.<Context>.<Subdomain>.<Subdomain>UnitOfWork.withScopedTransaction(async (repo) => {
	return repo.save(await repo.getNewInstance(command.<field>));
});
```

Then set nested fields through their setters, or append a collection entry with `getNewItem()`.
