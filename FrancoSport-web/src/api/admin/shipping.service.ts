import axios from '../axios';

export interface ShippingMethod {
    id: number;
    name: string;
    description?: string;
    base_cost: number;
    cost_per_kg: number;
    estimated_days_min: number;
    estimated_days_max: number;
    is_active: boolean;
    shipping_zone_id: number;
    created_at: string;
    updated_at: string;
}

export interface ShippingMethodFormData {
    name: string;
    description?: string;
    base_cost: number;
    cost_per_kg?: number;
    estimated_days_min: number;
    estimated_days_max: number;
    is_active?: boolean;
    shipping_zone_id?: number;
}

export interface ShippingFilters {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
}

export interface ShippingResponse {
    success: boolean;
    data: ShippingMethod[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

export const getShippingMethods = async (filters?: ShippingFilters) => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
    }

    const response = await axios.get<ShippingResponse>(`/admin/shipping?${params.toString()}`);
    return response.data;
};

export const getShippingMethod = async (id: number) => {
    const response = await axios.get<{ success: boolean; data: ShippingMethod }>(`/admin/shipping/${id}`);
    return response.data;
};

export const createShippingMethod = async (data: ShippingMethodFormData) => {
    const response = await axios.post<{ success: boolean; data: ShippingMethod; message: string }>(
        '/admin/shipping',
        data
    );
    return response.data;
};

export const updateShippingMethod = async (id: number, data: ShippingMethodFormData) => {
    const response = await axios.put<{ success: boolean; data: ShippingMethod; message: string }>(
        `/admin/shipping/${id}`,
        data
    );
    return response.data;
};

export const deleteShippingMethod = async (id: number) => {
    const response = await axios.delete<{ success: boolean; message: string }>(`/admin/shipping/${id}`);
    return response.data;
};

export const toggleShippingMethodStatus = async (id: number) => {
    const response = await axios.patch<{ success: boolean; data: ShippingMethod; message: string }>(
        `/admin/shipping/${id}/toggle-status`
    );
    return response.data;
};
