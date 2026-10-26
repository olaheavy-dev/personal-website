// Types for budget-assets.mjs, so its tests can import it from TypeScript.
export function inlinedStylesheets(html: string): Set<string>;
export function coversLatin(range: string): boolean;
export function downloadedAssets(assets: Iterable<string>, html: string, cssTexts: string[]): string[];
