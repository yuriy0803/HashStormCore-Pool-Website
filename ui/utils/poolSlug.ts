// ui/utils/poolSlug.ts
export const toPoolSlug = (id: string) => id.replaceAll("/", "_");
export const fromPoolSlug = (slug: string) => slug.replaceAll("_", "/");
