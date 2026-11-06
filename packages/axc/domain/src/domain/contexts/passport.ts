export type Visa = Readonly<Record<string, never>>;
export interface Passport {
	readonly visa: Visa;
}
