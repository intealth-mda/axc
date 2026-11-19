import type { EnrollmentRequest } from '@axc/service-mongoose';
import { type MongoDataSource, MongoDataSourceImpl } from '../../mongo-data-source.ts';

export interface EnrollmentRequestDataSource extends MongoDataSource<EnrollmentRequest> {}

export class EnrollmentRequestDataSourceImpl extends MongoDataSourceImpl<EnrollmentRequest> implements EnrollmentRequestDataSource {}
