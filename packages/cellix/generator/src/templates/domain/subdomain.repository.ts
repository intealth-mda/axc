import type { Shape } from '../../shape.ts';
import { creationFields } from '../../text.ts';

export function repository(entity: string, entityPascal: string, shape: Shape): string {
	const parameters = creationFields(shape)
		.map((field) => `${field.name}: ${field.type}`)
		.join(', ');
	const propsImports = shape.nested
		.filter((item) => item.kind !== 'entity')
		.map((item) => `import type { ${item.pascal}Props } from './${item.name}.value-objects.ts';`)
		.join('\n');
	const imports = [`import type { Repository } from '@cellix/domain-seedwork/repository';`, `import type { ${entityPascal}, ${entityPascal}Props } from './${entity}.aggregate.ts';`, propsImports]
		.filter((line) => line.length > 0)
		.join('\n');
	return `${imports}\n\nexport interface ${entityPascal}Repository<props extends ${entityPascal}Props> extends Repository<${entityPascal}<props>> {\n\tgetNewInstance(${parameters}): Promise<${entityPascal}<props>>;\n\tgetById(id: string): Promise<${entityPascal}<props>>;\n}\n`;
}
