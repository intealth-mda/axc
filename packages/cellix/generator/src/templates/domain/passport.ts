import { camel } from '../../names.ts';

export function passport(context: string, contextPascal: string, entityPascal: string, permissions: string[]): string {
	const contextKey = camel(context);
	const checks = permissions.map((permission) => `${permission}: true`).join(', ');
	return `import type { ${contextPascal}Visa } from './${context}/${context}.visa.ts';\n\nexport interface Passport {\n\t${contextKey}: {\n\t\tfor${entityPascal}(entity: unknown): ${contextPascal}Visa;\n\t};\n}\n\nexport const PassportFactory = {\n\tforSystem(): Passport {\n\t\treturn {\n\t\t\t${contextKey}: {\n\t\t\t\tfor${entityPascal}: (): ${contextPascal}Visa => ({\n\t\t\t\t\tdetermineIf: (check) => check({ ${checks} }),\n\t\t\t\t}),\n\t\t\t},\n\t\t};\n\t},\n};\n`;
}
