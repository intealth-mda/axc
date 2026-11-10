/** Public catalog reads do not carry a caller credential. */
export interface CoursePassport {
	readonly catalog: 'public';
}
