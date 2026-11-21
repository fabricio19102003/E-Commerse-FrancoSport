/**
 * Spanish labels for API enum values (shared by customer and admin pages).
 * The API values themselves never change; only what the user sees.
 */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  PAID: 'Pagado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  FAILED: 'Rechazado',
  REFUNDED: 'Reembolsado',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: 'Pago contra entrega',
  BANK_TRANSFER: 'Transferencia bancaria',
  QR_TRANSFER: 'Transferencia QR',
};

// Unknown values (a status added later) fall back to the raw value instead of hiding it
export const orderStatusLabel = (status: string): string => ORDER_STATUS_LABELS[status] ?? status;
export const paymentStatusLabel = (status: string): string => PAYMENT_STATUS_LABELS[status] ?? status;
export const paymentMethodLabel = (method: string): string => PAYMENT_METHOD_LABELS[method] ?? method;
