import type { mongooseContextBuilder } from '@axc/data-sources-mongoose-models';
import { CourseReadRepositoryImpl } from './course/index.ts';
export const CatalogContext = (models: ReturnType<typeof mongooseContextBuilder>) => ({ Course: CourseReadRepositoryImpl(models.Catalog.Course) });
