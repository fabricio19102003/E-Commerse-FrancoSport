import api from '@/api/axios';
import type { Promotion } from './admin/promotions.service';

export const getActivePromotion = async () => {
    const response = await api.get<Promotion | null>('/promotions/active');
    return response.data;
};
