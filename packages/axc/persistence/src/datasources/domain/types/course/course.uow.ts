import type { CourseUnitOfWork, Passport } from '@axc/domain';
import type { CourseModelType } from '@axc/service-mongoose';
import { InProcEventBusInstance, NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { CourseConverter } from './course.domain-adapter.ts';
import { CourseRepository } from './course.repository.ts';

export const getCourseUnitOfWork = (model: CourseModelType, passport: Passport): CourseUnitOfWork => {
	const unitOfWork = new MongooseSeedwork.MongoUnitOfWork(InProcEventBusInstance, NodeEventBusInstance, model, new CourseConverter(), CourseRepository);
	return MongooseSeedwork.getInitializedUnitOfWork(unitOfWork, passport);
};
