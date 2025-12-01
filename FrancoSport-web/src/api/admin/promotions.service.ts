import api from '@/api/axios';

export interface Promotion {
    id: number;
    title: string;
    description?: string;
    discount_percent?: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    image_url?: string;
    product_id?: number;
    product?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

export interface PromotionFormData {
    title: string;
    description?: string;
    discount_percent?: number;
    start_date: string;
    end_date: string;
    is_active?: boolean;
    image_url?: string;
    product_id?: number;
}

export const adminPromotionsService = {
    getPromotions: async () => {
        const response = await api.get<Promotion[]>('/admin/promotions');
        return response.data;
    },

    getPromotion: async (id: number) => {
        const response = await api.get<Promotion>(`/admin/promotions/${id}`);
        return response.data;
    },

    createPromotion: async (data: PromotionFormData) => {
        const response = await api.post<Promotion>('/admin/promotions', data);
        return response.data;
    },

    updatePromotion: async (id: number, data: PromotionFormData) => {
        const response = await api.put<Promotion>(`/admin/promotions/${id}`, data);
        return response.data;
    },

    deletePromotion: async (id: number) => {
        const response = await api.delete(`/admin/promotions/${id}`);
        return response.data;
    }
};
