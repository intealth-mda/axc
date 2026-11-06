import type { MemoryStore } from '../store.ts';
import { TrainingDomainDataSource } from './training/index.ts';
export const DomainDataSource = (store: MemoryStore) => ({ Training: TrainingDomainDataSource(store) });
