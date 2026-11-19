import type { Visa } from '@cellix/domain-seedwork/visa';
import type { TypesDomainPermissions } from './types.domain-permissions.ts';

export interface TypesVisa extends Visa<TypesDomainPermissions> {
	determineIf(func: (permissions: Readonly<TypesDomainPermissions>) => boolean): boolean;
}
