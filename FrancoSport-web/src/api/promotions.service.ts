import api from '@/api/axios';
import type { Promotion } from './admin/promotions.service';

export const getActivePromotions = async () => {
    const response = await api.get<Promotion[]>('/promotions/active');
    return response.data;
};

export const getPromotionById = async (id: number) => {
    const response = await api.get<Promotion & { products: any[] }>(`/promotions/${id}`);
    return response.data;
};
