export interface CatalogPassport {
	readonly canReadCatalog: boolean;
	readonly canManageEnrollment: boolean;
}

export const systemCatalogPassport: CatalogPassport = {
	canReadCatalog: true,
	canManageEnrollment: true,
};
