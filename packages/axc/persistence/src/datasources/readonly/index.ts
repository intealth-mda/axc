import type { mongooseContextBuilder } from '@axc/data-sources-mongoose-models';
import { CatalogContext } from './catalog/index.ts';
export const ReadonlyDataSourceImplementation = (models: ReturnType<typeof mongooseContextBuilder>) => ({ Catalog: CatalogContext(models) });
