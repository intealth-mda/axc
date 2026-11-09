import type { MemoryStore } from '../store.ts';
import { TrainingContext } from './training/index.ts';
export const ReadonlyDataSource = (store: MemoryStore) => ({ Training: TrainingContext(store) });
