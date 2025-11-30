import axios from '../axios';

export interface Review {
    id: number;
    product_id: number;
    user_id: number;
    rating: number;
    title?: string;
    comment: string;
    is_verified_purchase: boolean;
    is_approved: boolean;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    product: {
        id: number;
        name: string;
        slug: string;
        images: { url: string }[];
    };
}

export interface ReviewFilters {
    search?: string;
    is_approved?: boolean;
    product_id?: number;
    page?: number;
    limit?: number;
}

export interface ReviewsResponse {
    success: boolean;
    data: Review[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

export const getReviews = async (filters?: ReviewFilters) => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.is_approved !== undefined) params.append('is_approved', String(filters.is_approved));
        if (filters.product_id) params.append('product_id', String(filters.product_id));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
    }

    const response = await axios.get<ReviewsResponse>(`/admin/reviews?${params.toString()}`);
    return response.data;
};

export const getReview = async (id: number) => {
    const response = await axios.get<{ success: boolean; data: Review }>(`/admin/reviews/${id}`);
    return response.data;
};

export const approveReview = async (id: number) => {
    const response = await axios.patch<{ success: boolean; data: Review; message: string }>(
        `/admin/reviews/${id}/approve`
    );
    return response.data;
};

export const deleteReview = async (id: number) => {
    const response = await axios.delete<{ success: boolean; message: string }>(`/admin/reviews/${id}`);
    return response.data;
};
