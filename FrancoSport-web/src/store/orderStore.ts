/**
 * Order Store
 * Franco Sport E-Commerce
 * 
 * Maneja el estado de los pedidos
 */

import { create } from 'zustand';
import type { Order, CheckoutData } from '@/types';
import * as ordersService from '@/api/orders.service';

// ===== TYPES =====

interface OrderState {
    // State
    orders: Order[];
    currentOrder: Order | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchOrders: (status?: string) => Promise<void>;
    fetchOrder: (orderNumber: string) => Promise<void>;
    createOrder: (data: CheckoutData & { items: any[] }) => Promise<Order>;
    cancelOrder: (orderNumber: string, reason: string) => Promise<void>;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    resetCurrentOrder: () => void;
}

// ===== STORE =====

export const useOrderStore = create<OrderState>((set, get) => ({
    // ===== INITIAL STATE =====
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null,

    // ===== SETTERS =====
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    resetCurrentOrder: () => set({ currentOrder: null, error: null }),

    // ===== FETCH ORDERS =====
    fetchOrders: async (status) => {
        const { setLoading, setError } = get();
        try {
            setLoading(true);
            setError(null);
            const orders = await ordersService.getOrders(status);
            set({ orders });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cargar pedidos';
            setError(message);
        } finally {
            setLoading(false);
        }
    },

    // ===== FETCH ORDER =====
    fetchOrder: async (orderNumber) => {
        const { setLoading, setError } = get();
        try {
            setLoading(true);
            setError(null);
            const order = await ordersService.getOrder(orderNumber);
            set({ currentOrder: order });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cargar el pedido';
            setError(message);
        } finally {
            setLoading(false);
        }
    },

    // ===== CREATE ORDER =====
    createOrder: async (data) => {
        const { setLoading, setError } = get();
        try {
            setLoading(true);
            setError(null);
            const order = await ordersService.createOrder(data);
            // Optionally update orders list if we want to reflect it immediately
            // const { orders } = get();
            // set({ orders: [order, ...orders] });
            return order;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al crear el pedido';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    },

    // ===== CANCEL ORDER =====
    cancelOrder: async (orderNumber, reason) => {
        const { setLoading, setError, fetchOrders, fetchOrder } = get();
        try {
            setLoading(true);
            setError(null);
            await ordersService.cancelOrder(orderNumber, reason);

            // Refresh data
            await fetchOrders();
            if (get().currentOrder?.order_number === orderNumber) {
                await fetchOrder(orderNumber);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cancelar el pedido';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    },
}));

// ===== SELECTORS =====

export const useOrders = () => useOrderStore((state) => state.orders);
export const useCurrentOrder = () => useOrderStore((state) => state.currentOrder);
export const useOrderLoading = () => useOrderStore((state) => state.isLoading);
export const useOrderError = () => useOrderStore((state) => state.error);
