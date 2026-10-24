// Types for check-dashes.mjs, so its tests can import it from TypeScript.
export function checkText(name: string, text: string, ext: string): string[];
export function wordSegments(line: string, ext: string, state: { inBlockComment: boolean }): string[];
