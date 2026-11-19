import type { FilterQuery, Model } from 'mongoose';

export interface FindOptions {
	sort?: Record<string, 1 | -1>;
	limit?: number;
	skip?: number;
}

export interface FindOneOptions {
	projection?: Record<string, 0 | 1>;
}

export interface MongoDataSource<T> {
	find(filter: FilterQuery<T>, options?: FindOptions): Promise<T[]>;
	findById(id: string, options?: FindOneOptions): Promise<T | null>;
}

export class MongoDataSourceImpl<T> implements MongoDataSource<T> {
	private readonly model: Model<T>;

	constructor(model: Model<T>) {
		this.model = model;
	}

	async find(filter: FilterQuery<T>, options?: FindOptions): Promise<T[]> {
		const query = this.model.find(filter);
		if (options?.sort !== undefined) {
			query.sort(options.sort);
		}
		if (options?.skip !== undefined) {
			query.skip(options.skip);
		}
		if (options?.limit !== undefined) {
			query.limit(options.limit);
		}
		const documents = await query.exec();
		return [...documents];
	}

	async findById(id: string, options?: FindOneOptions): Promise<T | null> {
		return await this.model.findById(id, options?.projection).exec();
	}
}
