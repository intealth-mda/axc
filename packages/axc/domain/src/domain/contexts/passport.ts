import type { TypesDomainPermissions } from './types/types.domain-permissions.ts';
import type { TypesVisa } from './types/types.visa.ts';

const systemTypesPermissions: TypesDomainPermissions = {
	canManageCourse: true,
};

export interface Passport {
	types: {
		forCourse(entity: unknown): TypesVisa;
	};
}

export const PassportFactory = {
	forSystem(): Passport {
		return {
			types: {
				forCourse: (): TypesVisa => ({
					determineIf: (check) => check(systemTypesPermissions),
				}),
			},
		};
	},
};
