import type { TypesDomainPermissions } from './types/types.domain-permissions.ts';
import type { TypesVisa } from './types/types.visa.ts';

const systemTypesPermissions: TypesDomainPermissions = {
	canManageCourse: true,
	canManageEnrollmentRequest: true,
};

export interface Passport {
	types: {
		forCourse(entity: unknown): TypesVisa;
		forEnrollmentRequest(entity: unknown): TypesVisa;
	};
}

export const PassportFactory = {
	forSystem(): Passport {
		return {
			types: {
				forCourse: (): TypesVisa => ({
					determineIf: (check) => check(systemTypesPermissions),
				}),
				forEnrollmentRequest: (): TypesVisa => ({
					determineIf: (check) => check(systemTypesPermissions),
				}),
			},
		};
	},
};
