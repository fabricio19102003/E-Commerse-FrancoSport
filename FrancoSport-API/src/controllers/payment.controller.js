import prisma from '../utils/prisma.js';
import { runTransaction } from '../services/order.service.js';
import { uploadImageBuffer, deleteStoredImage } from '../services/storage.service.js';
import { PROJECT_FOLDER } from '../config/cloudinary.js';

const PROOF_FOLDER = `${PROJECT_FOLDER}/payment-proofs`;
const PROOF_PAYMENT_METHODS = ['QR_TRANSFER', 'BANK_TRANSFER'];
// A proof can be sent while the payment is pending, or retried after a rejection
const PROOF_PAYMENT_STATUSES = ['PENDING', 'FAILED'];
const PROOF_ORDER_STATUSES = ['PENDING', 'PROCESSING'];

const sendError = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message } });

/**
 * Get Payment Configuration
 * GET /api/payment/config
 */
export const getPaymentConfig = async (req, res, next) => {
  try {
    const config = await prisma.paymentConfig.findUnique({
      where: { method_name: 'BANK_TRANSFER' }
    });
    
    // If no config exists, return default or null
    res.json({ 
      success: true, 
      data: config || { 
        method_name: 'BANK_TRANSFER', 
        qr_code_url: null, 
        instructions: null, 
        is_active: false 
      } 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Payment Proof for Order
 * POST /api/payment/proof/:orderId
 *
 * Only the order owner, only for QR/bank transfer orders that are not
 * cancelled and whose payment is pending (or rejected). A foreign order and a
 * missing order get the same answer. The image is stored only after the rules
 * pass, and the order is updated with a conditional claim so a concurrent
 * cancellation or approval wins over a late upload.
 */
export const uploadPaymentProof = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'NO_FILE', 'No se ha subido ningún comprobante');
    }

    const orderId = Number(req.params.orderId);
    const order = Number.isInteger(orderId)
      ? await prisma.order.findFirst({ where: { id: orderId, user_id: req.user.id } })
      : null;

    if (!order) {
      return sendError(res, 404, 'ORDER_NOT_FOUND', 'Pedido no encontrado');
    }

    if (!PROOF_PAYMENT_METHODS.includes(order.payment_method)) {
      return sendError(res, 400, 'PROOF_NOT_ALLOWED', 'Este pedido no se paga por transferencia');
    }
    if (order.status === 'CANCELLED') {
      return sendError(res, 400, 'ORDER_CANCELLED', 'No se puede subir un comprobante a un pedido cancelado');
    }
    if (!PROOF_PAYMENT_STATUSES.includes(order.payment_status)) {
      return sendError(res, 400, 'PAYMENT_PROCESSED', 'El pago de este pedido ya fue procesado');
    }
    if (!PROOF_ORDER_STATUSES.includes(order.status)) {
      return sendError(res, 400, 'PROOF_NOT_ALLOWED', 'El pedido ya no admite comprobantes de pago');
    }

    const image = await uploadImageBuffer(req.file.buffer, { folder: PROOF_FOLDER });

    const updatedOrder = await runTransaction(prisma, async (tx) => {
      const claimed = await tx.order.updateMany({
        where: {
          id: order.id,
          status: order.status,
          payment_status: { in: PROOF_PAYMENT_STATUSES },
        },
        data: { payment_proof_url: image.url, payment_status: 'PENDING' },
      });
      if (claimed.count === 0) return null;

      await tx.orderStatusHistory.create({
        data: {
          order_id: order.id,
          status: order.status,
          notes: order.payment_proof_url ? 'Comprobante de pago reemplazado' : 'Comprobante de pago subido',
          created_by: req.user.id,
        },
      });

      return tx.order.findUnique({ where: { id: order.id } });
    });

    if (!updatedOrder) {
      // The order changed while the image was uploading: do not keep an orphan image
      deleteStoredImage(image.public_id).catch((err) => console.error('Failed to delete orphan proof:', err));
      return sendError(res, 409, 'ORDER_CHANGED', 'El pedido cambió mientras tanto; recargue e intente de nuevo');
    }

    res.json({
      success: true,
      message: 'Comprobante subido exitosamente. El pago está en revisión.',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
