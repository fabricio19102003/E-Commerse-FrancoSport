import axios from '../axios';

export interface Coupon {
    id: number;
    code: string;
    discount_type: 'PERCENTAGE' | 'FIXED';
    discount_value: number;
    min_purchase_amount?: number;
    max_discount_amount?: number;
    start_date: string;
    end_date: string;
    usage_limit?: number;
    used_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CouponFormData {
    code: string;
    discount_type: 'PERCENTAGE' | 'FIXED';
    discount_value: number;
    min_purchase_amount?: number;
    max_discount_amount?: number;
    start_date: string;
    end_date: string;
    usage_limit?: number;
    is_active?: boolean;
}

export interface CouponFilters {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
}

export interface CouponsResponse {
    success: boolean;
    data: Coupon[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

export const getCoupons = async (filters?: CouponFilters) => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
    }

    const response = await axios.get<CouponsResponse>(`/admin/coupons?${params.toString()}`);
    return response.data;
};

export const getCoupon = async (id: number) => {
    const response = await axios.get<{ success: boolean; data: Coupon }>(`/admin/coupons/${id}`);
    return response.data;
};

export const createCoupon = async (data: CouponFormData) => {
    const response = await axios.post<{ success: boolean; data: Coupon; message: string }>(
        '/admin/coupons',
        data
    );
    return response.data;
};

export const updateCoupon = async (id: number, data: CouponFormData) => {
    const response = await axios.put<{ success: boolean; data: Coupon; message: string }>(
        `/admin/coupons/${id}`,
        data
    );
    return response.data;
};

export const deleteCoupon = async (id: number) => {
    const response = await axios.delete<{ success: boolean; message: string }>(`/admin/coupons/${id}`);
    return response.data;
};

export const toggleCouponStatus = async (id: number) => {
    const response = await axios.patch<{ success: boolean; data: Coupon; message: string }>(
        `/admin/coupons/${id}/toggle-status`
    );
    return response.data;
};
