import client from '../axios';
import type { PaymentConfig } from '../payment.service';

export const adminPaymentService = {
    updatePaymentConfig: async (data: { instructions: string; is_active: boolean; qr_code?: File }) => {
        const formData = new FormData();
        formData.append('instructions', data.instructions);
        formData.append('is_active', String(data.is_active));
        if (data.qr_code) {
            formData.append('qr_code', data.qr_code);
        }
        const response = await client.put<{ success: boolean; data: PaymentConfig }>('/admin/payment/config', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // paymentProofUrl: the proof the admin is looking at; the API refuses to approve if it was replaced meanwhile
    approvePayment: async (orderId: number, paymentProofUrl?: string) => {
        const response = await client.post(`/admin/payment/approve/${orderId}`, { payment_proof_url: paymentProofUrl });
        return response.data;
    }
};
