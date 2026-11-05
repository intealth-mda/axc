export interface Course {
	readonly id: string;
	readonly title: string;
	readonly summary: string;
	readonly modality: 'online' | 'in-person' | 'hybrid';
	readonly status: 'draft' | 'active' | 'retired';
	readonly tags: readonly string[];
	readonly createdAt: string;
	readonly updatedAt: string;
}
export interface CourseSearchQuery {
	q?: string;
	modality?: string;
	status?: string;
	tag?: string;
	page: number;
	pageSize: number;
	sort: string;
}
export interface CourseSearchResult {
	items: Course[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}
