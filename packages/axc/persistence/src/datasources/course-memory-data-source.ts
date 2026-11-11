import { Course, type CourseModality, type CourseRepository, type CourseStatus, courseModalities, courseStatuses, systemCatalogPassport } from '@axc/domain';
import { createMemoryMongoServer } from '@axc/service-mongoose';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import mongoose from 'mongoose';
import { courseSeed } from './course.seed.ts';

interface CourseDocument {
	_id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

const courseSchema = new mongoose.Schema<CourseDocument>(
	{
		_id: { type: String, required: true },
		title: { type: String, required: true },
		summary: { type: String, required: true },
		modality: { type: String, required: true },
		status: { type: String, required: true },
		tags: { type: [String], required: true },
		createdAt: { type: String, required: true },
		updatedAt: { type: String, required: true },
	},
	{ collection: 'courses', versionKey: false },
);

export interface DataSources {
	readonlyDataSource: {
		course: CourseRepository;
	};
}

let ready: Promise<mongoose.Model<CourseDocument>> | undefined;

function isModality(value: string): value is CourseModality {
	return courseModalities.some((item) => item === value);
}

function isStatus(value: string): value is CourseStatus {
	return courseStatuses.some((item) => item === value);
}

function courseModel(): Promise<mongoose.Model<CourseDocument>> {
	ready ??= (async () => {
		const memory = createMemoryMongoServer();
		await memory.start();
		await mongoose.connect(memory.getUri());
		// biome-ignore lint/complexity/useLiteralKeys: index signature
		const model = mongoose.models['CourseCatalog'] ?? mongoose.model<CourseDocument>('CourseCatalog', courseSchema);
		const count = await model.countDocuments();
		if (count === 0) {
			await model.insertMany(
				courseSeed.map((course) => ({
					_id: course.id,
					title: course.title,
					summary: course.summary,
					modality: course.modality,
					status: course.status,
					tags: [...course.tags],
					createdAt: course.createdAt,
					updatedAt: course.updatedAt,
				})),
			);
		}
		return model;
	})();
	return ready;
}

class MemoryCourseRepository implements CourseRepository {
	public async get(id: string): Promise<Course> {
		const courses = await this.list();
		const found = courses.find((course) => course.id === id);
		if (found === undefined) {
			return Promise.reject(new NotFoundError(`Course ${id} was not found.`));
		}
		return found;
	}

	public async save(item: Course): Promise<Course> {
		await Promise.resolve();
		return item;
	}

	public async list(): Promise<readonly Course[]> {
		const model = await courseModel();
		const documents = await model.find().lean<CourseDocument[]>();
		return documents.map((document) => {
			if (!isModality(document.modality) || !isStatus(document.status)) {
				throw new Error(`Course ${document._id} has an invalid catalog value.`);
			}
			return Course.getNewInstance(
				{
					id: document._id,
					title: document.title,
					summary: document.summary,
					modality: document.modality,
					status: document.status,
					tags: document.tags,
					createdAt: document.createdAt,
					updatedAt: document.updatedAt,
				},
				systemCatalogPassport,
			);
		});
	}
}

let repository: MemoryCourseRepository | undefined;

export function getDataSources(): DataSources {
	repository ??= new MemoryCourseRepository();
	return {
		readonlyDataSource: {
			course: repository,
		},
	};
}
