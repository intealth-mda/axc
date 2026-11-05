import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;
export type { UnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
export { InMemoryCourseRepository, InMemoryEnrollmentRequestRepository } from './in-memory-repositories.ts';
