import prisma from '../../utils/prisma.js';

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

/**
 * Approve Payment for Order
 * POST /api/admin/payment/approve/:orderId
 */
export const approvePayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        payment_status: 'PAID',
        status: 'PROCESSING' // Or whatever the next status is
      }
    });

    // Add history entry
    await prisma.orderStatusHistory.create({
      data: {
        order_id: order.id,
        status: 'PROCESSING',
        notes: 'Pago aprobado por administrador',
        created_by: req.user.id // Assuming req.user is set by auth middleware
      }
    });

    res.json({ success: true, data: order, message: 'Pago aprobado exitosamente' });
  } catch (error) {
    next(error);
  }
};
