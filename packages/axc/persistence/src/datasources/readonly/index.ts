import type { MemoryStore } from '../store.ts';
import { TrainingReadonlyDataSource } from './training/index.ts';
export const ReadonlyDataSource = (store: MemoryStore) => ({ Training: TrainingReadonlyDataSource(store) });
