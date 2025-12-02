import axios from './axios';

export interface LoyaltyTransaction {
    id: number;
    user_id: number;
    order_id?: number;
    points: number;
    type: 'EARNED' | 'REDEEMED' | 'ADJUSTMENT';
    description?: string;
    created_at: string;
    order?: {
        order_number: string;
        total_amount: number;
    };
}

export interface PointsHistoryResponse {
    current_points: number;
    history: LoyaltyTransaction[];
}

export const loyaltyService = {
    getHistory: async () => {
        const response = await axios.get<{ success: boolean; data: PointsHistoryResponse }>('/loyalty/history');
        return response.data.data;
    },
};
