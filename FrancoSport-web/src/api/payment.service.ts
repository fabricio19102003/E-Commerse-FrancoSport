import client from './axios';

export interface PaymentConfig {
    id: number;
    method_name: string;
    qr_code_url: string | null;
    instructions: string | null;
    is_active: boolean;
}

export const paymentService = {
    getPaymentConfig: async () => {
        const response = await client.get<{ success: boolean; data: PaymentConfig }>('/payment/config');
        return response.data;
    },

    uploadPaymentProof: async (orderId: number, file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await client.post(`/payment/proof/${orderId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
