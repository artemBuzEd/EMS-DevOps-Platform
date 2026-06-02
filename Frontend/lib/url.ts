const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:10000";

export function resolveAssetUrl(path?: string | null): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path; // already absolute
    return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}