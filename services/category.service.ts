import { api } from "@/lib/axios";
import { unwrapData } from "@/services/mappers";
import { AdminCategory } from "@/types";

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object"
        ? value as Record<string, unknown>
        : {};
}

function asString(value: unknown) {
    return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown) {
    return typeof value === "string" && value.trim() ? value : null;
}

function mapCategory(raw: Record<string, unknown>): AdminCategory {
    return {
        ID: asString(raw.id),
        Name: asString(raw.name),
        CreatedAt: asNullableString(raw.createdAt ?? raw.created_at),
        UpdatedAt: asNullableString(raw.updatedAt ?? raw.updated_at),
    };
}

export const categoryService = {
    async getCategories() {
        const response = await api.get("/organization/categories");
        return unwrapData<Record<string, unknown>[]>(response).map((item) =>
            mapCategory(asRecord(item)),
        );
    },

    async getCategory(id: string) {
        const response = await api.get(`/organization/categories/${id}`);
        return mapCategory(asRecord(unwrapData<Record<string, unknown>>(response)));
    },

    createCategory: (payload: { name: string }) =>
        api.post("/organization/categories", payload),

    updateCategory: (id: string, payload: { name: string }) =>
        api.patch(`/organization/categories/${id}`, payload),

    deleteCategory: (id: string) =>
        api.delete(`/organization/categories/${id}`),
};
