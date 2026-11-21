import prisma from '../../utils/prisma.js';
import { runTransaction } from '../../services/order.service.js';

/**
 * Update Payment Configuration (QR Code, Instructions)
 * PUT /api/admin/payment/config
 */
export const updatePaymentConfig = async (req, res, next) => {
  try {
    const { instructions, is_active } = req.body;
    let qr_code_url = undefined;
    
    if (req.file) {
      qr_code_url = req.file.path;
    }

    const config = await prisma.paymentConfig.upsert({
      where: { method_name: 'BANK_TRANSFER' },
      update: {
        instructions,
        is_active: is_active === 'true' || is_active === true,
        ...(qr_code_url && { qr_code_url })
      },
      create: {
        method_name: 'BANK_TRANSFER',
        instructions,
        is_active: is_active === 'true' || is_active === true,
        qr_code_url
      }
    });

    res.json({ success: true, data: config, message: 'Configuración de pago actualizada' });
  } catch (error) {
    next(error);
  }
};

const sendError = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message } });

const APPROVABLE_STATUSES = ['PENDING', 'PROCESSING'];

/**
 * Approve Payment for Order
 * POST /api/admin/payment/approve/:orderId
 *
 * Only pending payments that have a proof, on orders that are not cancelled,
 * refunded or past processing. The approval is a conditional claim inside one
 * transaction together with the history row, so a repeated or concurrent
 * approval (or a cancellation that got there first) changes nothing more.
 */
export const approvePayment = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const order = Number.isInteger(orderId) ? await prisma.order.findUnique({ where: { id: orderId } }) : null;

    if (!order) {
      return sendError(res, 404, 'ORDER_NOT_FOUND', 'Pedido no encontrado');
    }
    if (order.status === 'CANCELLED') {
      return sendError(res, 400, 'ORDER_CANCELLED', 'No se puede aprobar el pago de un pedido cancelado');
    }
    if (order.status === 'REFUNDED' || order.payment_status === 'REFUNDED') {
      return sendError(res, 400, 'ORDER_REFUNDED', 'No se puede aprobar el pago de un pedido reembolsado');
    }
    if (order.payment_status === 'PAID') {
      return sendError(res, 409, 'PAYMENT_ALREADY_APPROVED', 'El pago de este pedido ya fue aprobado');
    }
    if (order.payment_status === 'FAILED') {
      return sendError(
        res,
        400,
        'PAYMENT_REJECTED',
        'El pago de este pedido fue rechazado; el cliente debe subir un nuevo comprobante'
      );
    }
    if (!order.payment_proof_url) {
      return sendError(res, 400, 'NO_PAYMENT_PROOF', 'El pedido no tiene comprobante de pago');
    }
    if (!APPROVABLE_STATUSES.includes(order.status)) {
      return sendError(res, 400, 'ORDER_STATUS_INVALID', 'El pedido no está en un estado que permita aprobar el pago');
    }

    const approved = await runTransaction(prisma, async (tx) => {
      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          status: { in: APPROVABLE_STATUSES },
          payment_status: 'PENDING',
          payment_proof_url: { not: null },
        },
        data: { payment_status: 'PAID', status: 'PROCESSING' },
      });
      if (claimed.count === 0) return null;

      await tx.orderStatusHistory.create({
        data: {
          order_id: order.id,
          status: 'PROCESSING',
          notes: 'Pago aprobado por administrador',
          created_by: req.user.id,
        },
      });

      return tx.order.findUnique({ where: { id: order.id } });
    });

    if (!approved) {
      return sendError(res, 409, 'ORDER_CHANGED', 'El pedido cambió mientras tanto; recargue e intente de nuevo');
    }

    res.json({ success: true, data: approved, message: 'Pago aprobado exitosamente' });
  } catch (error) {
    next(error);
  }
};
