export interface CatalogPassport {
	readonly canReadCatalog: boolean;
}

export const systemCatalogPassport: CatalogPassport = {
	canReadCatalog: true,
};
