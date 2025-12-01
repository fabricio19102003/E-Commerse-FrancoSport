import axios from './axios';
import type { Review, CreateReviewInput } from '@/types';

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

export const reviewsService = {
    createReview: async (data: CreateReviewInput) => {
        const response = await axios.post('/reviews', data);
        return response.data;
    },

    getProductReviews: async (productId: number, page = 1, limit = 10) => {
        const response = await axios.get<ReviewsResponse>(`/reviews/product/${productId}`, {
            params: { page, limit },
        });
        return response.data;
    },
};
