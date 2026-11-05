import type { CatalogVisa } from './catalog/catalog.visa.ts';

export interface Passport {
	catalog: {
		forCourse(entity: unknown): CatalogVisa;
		forEnrollmentRequest(entity: unknown): CatalogVisa;
	};
}

export const PassportFactory = {
	forSystem(): Passport {
		return {
			catalog: {
				forCourse: (): CatalogVisa => ({
					determineIf: (check) => check({ canManageCourse: true, canManageEnrollmentRequest: true }),
				}),
				forEnrollmentRequest: (): CatalogVisa => ({
					determineIf: (check) => check({ canManageCourse: true, canManageEnrollmentRequest: true }),
				}),
			},
		};
	},
};
