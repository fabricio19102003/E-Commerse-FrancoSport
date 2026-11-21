import axios from '../axios';

export type CouponDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

/** Same fields as the API Coupon model; decimals (Bs.) arrive as strings */
export interface Coupon {
    id: number;
    code: string;
    description: string;
    discount_type: CouponDiscountType;
    discount_value: string;
    minimum_purchase_amount: string | null;
    maximum_discount_amount: string | null;
    usage_limit_total: number | null;
    usage_limit_per_user: number | null;
    times_used: number;
    starts_at: string;
    expires_at: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Body of create and update (PUT replaces the editable fields); null or absent limits mean none.
 * discount_value is ignored for FREE_SHIPPING (the API stores 0). */
export interface CouponFormData {
    code: string;
    description: string;
    discount_type: CouponDiscountType;
    discount_value: number;
    minimum_purchase_amount?: number | null;
    maximum_discount_amount?: number | null;
    usage_limit_total?: number | null;
    usage_limit_per_user?: number | null;
    starts_at: string;
    expires_at: string;
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
