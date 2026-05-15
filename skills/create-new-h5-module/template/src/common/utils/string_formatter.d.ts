import './string_formatter.js';

declare global {
	interface String {
		format(...input: string[]): string;
		replaceJSX(...input: any[]): any;
	}
}
