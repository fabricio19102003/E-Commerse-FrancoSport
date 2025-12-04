import * as emailService from '../services/email.service.js';

export const sendMarketingEmail = async (req, res, next) => {
  try {
    const { subject, title, message, link, linkText, testEmail } = req.body;
    let { imageUrl } = req.body;

    // If file is uploaded, use its path (Cloudinary URL)
    if (req.file) {
      imageUrl = req.file.path;
    }

    if (!subject || !title || !message) {
      return res.status(400).json({
        message: 'Por favor complete todos los campos requeridos (Asunto, Título, Mensaje)',
      });
    }

    const emailData = {
      subject,
      title,
      message,
      imageUrl,
      link,
      linkText,
    };

    if (testEmail) {
      // Send test email to specific address (usually the admin's email)
      await emailService.sendMarketingEmail({ email: testEmail }, emailData);
      return res.json({
        success: true,
        message: `Email de prueba enviado a ${testEmail}`,
      });
    }

    // Broadcast to all users
    const result = await emailService.broadcastMarketingEmail(emailData);

    res.json({
      success: true,
      message: 'Campaña de marketing enviada exitosamente',
      details: result,
    });
  } catch (error) {
    next(error);
  }
};
