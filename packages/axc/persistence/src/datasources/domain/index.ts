import type { MemoryStore } from '../store.ts';
import { TrainingContext } from './training/index.ts';
export const DomainDataSource = (store: MemoryStore) => ({ Training: TrainingContext(store) });
