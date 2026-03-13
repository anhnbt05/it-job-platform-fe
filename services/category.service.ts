import { api } from "@/lib/axios";

export const categoryService = {
    getCategories: () =>
        api.get("/categories"),
};
