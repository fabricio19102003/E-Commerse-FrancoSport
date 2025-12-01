/**
 * Email Templates
 * Franco Sport E-Commerce
 */

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; }
    .highlight { color: #d32f2f; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Franco Sport</h1>
      <p>No es suerte, es esfuerzo</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Franco Sport. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

export const welcomeTemplate = (name) => baseTemplate(`
  <h2>¡Bienvenido a Franco Sport, ${name}!</h2>
  <p>Estamos emocionados de tenerte con nosotros. En Franco Sport encontrarás el mejor equipamiento deportivo para alcanzar tus metas.</p>
  <p>Explora nuestra tienda y descubre nuestras ofertas exclusivas.</p>
  <div style="text-align: center; margin-top: 20px;">
    <a href="${process.env.FRONTEND_URL}" class="button">Ir a la Tienda</a>
  </div>
`);

export const verificationTemplate = (name, link) => baseTemplate(`
  <h2>Verifica tu correo electrónico</h2>
  <p>Hola ${name},</p>
  <p>Gracias por registrarte. Por favor, haz clic en el siguiente enlace para verificar tu dirección de correo electrónico:</p>
  <div style="text-align: center; margin-top: 20px;">
    <a href="${link}" class="button">Verificar Email</a>
  </div>
  <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
`);

export const passwordResetTemplate = (name, link) => baseTemplate(`
  <h2>Recuperación de Contraseña</h2>
  <p>Hola ${name},</p>
  <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
  <div style="text-align: center; margin-top: 20px;">
    <a href="${link}" class="button">Restablecer Contraseña</a>
  </div>
  <p>Este enlace expirará en 1 hora.</p>
  <p>Si no solicitaste esto, por favor contacta a soporte inmediatamente.</p>
`);

export const orderConfirmationTemplate = (order) => baseTemplate(`
  <h2>¡Gracias por tu pedido!</h2>
  <p>Hola ${order.user.first_name},</p>
  <p>Hemos recibido tu pedido <span class="highlight">#${order.order_number}</span> y lo estamos procesando.</p>
  
  <h3>Resumen del Pedido</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr style="border-bottom: 1px solid #ddd;">
      <th style="text-align: left; padding: 8px;">Producto</th>
      <th style="text-align: right; padding: 8px;">Cantidad</th>
      <th style="text-align: right; padding: 8px;">Precio</th>
    </tr>
    ${order.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px;">${item.product_name}</td>
        <td style="text-align: right; padding: 8px;">${item.quantity}</td>
        <td style="text-align: right; padding: 8px;">$${item.price}</td>
      </tr>
    `).join('')}
    <tr>
      <td colspan="2" style="text-align: right; padding: 8px; font-weight: bold;">Total:</td>
      <td style="text-align: right; padding: 8px; font-weight: bold;">$${order.total_amount}</td>
    </tr>
  </table>

  <p>Te notificaremos cuando tu pedido sea enviado.</p>
  <div style="text-align: center; margin-top: 20px;">
    <a href="${process.env.FRONTEND_URL}/pedido/${order.id}" class="button">Ver Pedido</a>
  </div>
`);

export const orderStatusTemplate = (order, status) => {
  const statusMessages = {
    PROCESSING: 'Tu pedido está siendo preparado.',
    SHIPPED: '¡Tu pedido ha sido enviado!',
    DELIVERED: 'Tu pedido ha sido entregado.',
    CANCELLED: 'Tu pedido ha sido cancelado.',
  };

  return baseTemplate(`
    <h2>Actualización de Estado</h2>
    <p>Hola ${order.user.first_name},</p>
    <p>El estado de tu pedido <span class="highlight">#${order.order_number}</span> ha cambiado a: <strong>${status}</strong></p>
    <p>${statusMessages[status] || ''}</p>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${process.env.FRONTEND_URL}/pedido/${order.id}" class="button">Rastrear Pedido</a>
    </div>
  `);
};
