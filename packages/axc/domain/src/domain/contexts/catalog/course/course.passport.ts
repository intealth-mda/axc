/** Read passport for catalog queries. Search does not authorize callers. */
export interface CoursePassport {
	readonly read: true;
}
