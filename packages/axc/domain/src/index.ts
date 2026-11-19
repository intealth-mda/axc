import type { Repository } from '@cellix/domain-seedwork/repository';

/** Repositories added in this package implement the Cellix repository contract. */
export type DomainRepository<T> = Repository<T>;
export * from './domain/contexts/training/course/index.ts';
export * from './domain/contexts/training/enrollment-request/index.ts';
