import prisma from '../utils/prisma.js';

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
 */
export const uploadPaymentProof = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se ha subido ningún comprobante' 
      });
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    // Update order with proof URL
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: {
        payment_proof_url: req.file.path,
        payment_status: 'PENDING', // Ensure it's pending
        // We could also add a note to history
      }
    });

    res.json({ 
      success: true, 
      message: 'Comprobante subido exitosamente. El pago está en revisión.', 
      data: updatedOrder 
    });
  } catch (error) {
    next(error);
  }
};
