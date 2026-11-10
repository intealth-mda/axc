/** Read catalog permission. Course search does not authorize writes. */
export interface CourseDomainPermissions {
	readonly canReadCatalog: boolean;
}
