import type { Stand } from "./types";
import { ALLOWED_CATEGORIES } from "./config";

function validateStand(body: Partial<Stand>): string | null {
    if (!body.address?.trim()) return "address is required";
    if (body.categories) {
        const invalid = (body.categories as string[]).filter((c) => !ALLOWED_CATEGORIES.includes(c));
        if (invalid.length > 0) return `unknown categories: ${invalid.join(", ")}`;
    }
    return null;
}

export { ALLOWED_CATEGORIES, validateStand };
