import type { ResourceGroup } from './models/root.js';

export function missingLinks(group: ResourceGroup, required: readonly string[]): string[] {
    return required.filter((name) => group.Links[name] === undefined);
}
