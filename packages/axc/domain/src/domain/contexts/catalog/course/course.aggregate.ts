import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';
import type { Visa } from '@cellix/domain-seedwork/visa';
import type { CatalogPassport } from '../catalog.passport.ts';
import type { CourseProps } from './course.entity.ts';

export class Course extends DomainSeedwork.AggregateRoot<CourseProps, CatalogPassport> {
	private readonly visa: Visa<CatalogPassport>;

	private constructor(props: CourseProps, passport: CatalogPassport, visa: Visa<CatalogPassport>) {
		super(props, passport);
		this.visa = visa;
	}

	public static getNewInstance(props: CourseProps, passport: CatalogPassport): Course {
		const visa: Visa<CatalogPassport> = {
			determineIf: (func) => func(passport),
		};
		return new Course(props, passport, visa);
	}

	public allowsRead(): boolean {
		return this.visa.determineIf((permissions) => permissions.canReadCatalog);
	}
}
