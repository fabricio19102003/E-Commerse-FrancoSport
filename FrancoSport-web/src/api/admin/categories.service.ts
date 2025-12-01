import axios from '../axios';

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    parent_id?: number;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    parent?: Category;
    children?: Category[];
    _count?: {
        products: number;
    };
}

export interface CategoryFormData {
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    parent_id?: number | string;
    display_order?: number;
    is_active?: boolean;
}

export interface CategoryFilters {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
}

export interface CategoriesResponse {
    success: boolean;
    data: Category[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

export const getCategories = async (filters?: CategoryFilters) => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
    }

    const response = await axios.get<CategoriesResponse>(`/admin/categories?${params.toString()}`);
    return response.data;
};

export const getCategory = async (id: number) => {
    const response = await axios.get<{ success: boolean; data: Category }>(`/admin/categories/${id}`);
    return response.data;
};

export const createCategory = async (data: CategoryFormData | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await axios.post<{ success: boolean; data: Category; message: string }>(
        '/admin/categories',
        data,
        {
            headers: {
                'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
            },
        }
    );
    return response.data;
};

export const updateCategory = async (id: number, data: CategoryFormData | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await axios.put<{ success: boolean; data: Category; message: string }>(
        `/admin/categories/${id}`,
        data,
        {
            headers: {
                'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
            },
        }
    );
    return response.data;
};

export const deleteCategory = async (id: number) => {
    const response = await axios.delete<{ success: boolean; message: string }>(`/admin/categories/${id}`);
    return response.data;
};

export const toggleCategoryStatus = async (id: number) => {
    const response = await axios.patch<{ success: boolean; data: Category; message: string }>(
        `/admin/categories/${id}/toggle-status`
    );
    return response.data;
};
