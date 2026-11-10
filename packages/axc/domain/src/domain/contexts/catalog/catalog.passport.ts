export interface CatalogReadPermissions {
	readonly canReadCatalog: boolean;
}

export class CatalogPassport {
	public readonly actorId: string;
	public constructor(actorId: string = 'catalog-reader') {
		this.actorId = actorId;
	}
}
