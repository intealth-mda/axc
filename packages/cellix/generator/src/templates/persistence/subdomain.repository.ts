import type { Shape } from '../../shape.ts';
import { creationFields, namespacePath } from '../../text.ts';

export function persistenceRepository(input: { entity: string; entityPascal: string; contextPascal: string; scope: string; shape: Shape }): string {
	const { entity, entityPascal, contextPascal, scope, shape } = input;
	const domainPath = namespacePath(contextPascal, entityPascal);
	const created = creationFields(shape);
	const parameters = created.map((field) => `${field.name}: ${field.persistenceType}`).join(', ');
	const forwarded = created.map((field) => field.name).join(', ');
	return `import type { ${entityPascal} } from '${scope}/data-sources-mongoose-models';
import { Domain } from '${scope}/domain';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { ${entityPascal}DomainAdapter } from './${entity}.domain-adapter.ts';

export class ${entityPascal}Repository extends MongooseSeedwork.MongoRepositoryBase<${entityPascal}, ${entityPascal}DomainAdapter, Domain.Passport, Domain.Contexts.${domainPath}<${entityPascal}DomainAdapter>> implements Domain.Contexts.${domainPath}Repository<${entityPascal}DomainAdapter> {
	async getById(id: string): Promise<Domain.Contexts.${domainPath}<${entityPascal}DomainAdapter>> {
		const stored = await this.model.collection.findOne({ _id: id } as never);
		const document = stored === null ? await this.model.findById(id).exec() : this.model.hydrate(stored);
		if (!document) {
			throw new Error(\`${entityPascal} with id \${id} not found\`);
		}
		return this.typeConverter.toDomain(document, this.passport);
	}

	// biome-ignore lint:noRequireAwait
	async getNewInstance(${parameters}): Promise<Domain.Contexts.${domainPath}<${entityPascal}DomainAdapter>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(Domain.Contexts.${domainPath}.getNewInstance(adapter${forwarded.length > 0 ? `, ${forwarded}` : ''}, this.passport));
	}
}
`;
}
