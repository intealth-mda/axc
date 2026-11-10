/** Public catalog reads do not authorize callers. The aggregate contract still requires a passport type. */
export interface CoursePassport {
	readonly kind: 'course-catalog';
}
