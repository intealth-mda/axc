import type { Visa } from '@cellix/domain-seedwork/visa';

export interface CatalogPassport {
	readonly actorId: string;
}

export interface CatalogReadPermissions {
	readonly canReadCatalog: boolean;
}

export const systemCatalogPassport: CatalogPassport = {
	actorId: 'catalog-system',
};

export const catalogReadVisa: Visa<CatalogReadPermissions> = {
	determineIf(func: (permissions: Readonly<CatalogReadPermissions>) => boolean): boolean {
		return func({ canReadCatalog: true });
	},
};
