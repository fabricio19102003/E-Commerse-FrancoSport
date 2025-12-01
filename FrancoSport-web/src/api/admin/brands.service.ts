import axios from '../axios';

export interface Brand {
    id: number;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    website_url?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    _count?: {
        products: number;
    };
}

export interface BrandFormData {
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    website_url?: string;
    is_active?: boolean;
}

export interface BrandFilters {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
}

export interface BrandsResponse {
    success: boolean;
    data: Brand[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

export const getBrands = async (filters?: BrandFilters) => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
    }

    const response = await axios.get<BrandsResponse>(`/admin/brands?${params.toString()}`);
    return response.data;
};

export const getBrand = async (id: number) => {
    const response = await axios.get<{ success: boolean; data: Brand }>(`/admin/brands/${id}`);
    return response.data;
};

export const createBrand = async (data: BrandFormData | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await axios.post<{ success: boolean; data: Brand; message: string }>(
        '/admin/brands',
        data,
        {
            headers: {
                'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
            },
        }
    );
    return response.data;
};

export const updateBrand = async (id: number, data: BrandFormData | FormData) => {
    const isFormData = data instanceof FormData;
    const response = await axios.put<{ success: boolean; data: Brand; message: string }>(
        `/admin/brands/${id}`,
        data,
        {
            headers: {
                'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
            },
        }
    );
    return response.data;
};

export const deleteBrand = async (id: number) => {
    const response = await axios.delete<{ success: boolean; message: string }>(`/admin/brands/${id}`);
    return response.data;
};

export const toggleBrandStatus = async (id: number) => {
    const response = await axios.patch<{ success: boolean; data: Brand; message: string }>(
        `/admin/brands/${id}/toggle-status`
    );
    return response.data;
};
