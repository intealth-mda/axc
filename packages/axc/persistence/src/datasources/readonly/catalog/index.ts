import type { CourseRecord } from '@axc/data-sources-mongoose-models';
import { Course } from './course/index.ts';
export const Catalog = (records: CourseRecord[]) => ({ Course: Course(records) });
