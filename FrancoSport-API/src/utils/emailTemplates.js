/**
 * Email Templates
 * Franco Sport E-Commerce
 */

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #000000; color: #ffffff; padding: 30px 20px; text-align: center; }
    .logo { max-width: 150px; height: auto; margin-bottom: 10px; }
    .content { padding: 40px 30px; }
    .footer { background-color: #f9f9f9; padding: 30px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
    .button { display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; }
    .highlight { color: #d32f2f; font-weight: bold; }
    h1, h2, h3 { margin-top: 0; color: #000000; }
    h2 { font-size: 24px; margin-bottom: 20px; }
    p { margin-bottom: 20px; color: #444444; }
    .divider { height: 1px; background-color: #eeeeee; margin: 30px 0; }
    .social-links { margin-top: 20px; }
    .social-links a { color: #888888; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- Replace with your actual logo URL -->
      <img src="https://res.cloudinary.com/dw9dllecg/image/upload/v1733326181/franco-sport/assets/email-logo-v2.jpg" alt="Franco Sport" class="logo" style="display: block; margin: 0 auto 15px;">
      <div style="font-size: 14px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.8;">No es suerte, es esfuerzo</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Franco Sport. Todos los derechos reservados.</p>
      <p>Este correo fue enviado porque te registraste en nuestra tienda.</p>
      <div class="social-links">
        <a href="#">Instagram</a> • <a href="#">Facebook</a> • <a href="#">TikTok</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const welcomeTemplate = (name) => baseTemplate(`
  <div style="text-align: center;">
    <h2>¡Bienvenido al Equipo, ${name}!</h2>
    <p>Gracias por unirte a Franco Sport. Estás a un paso de llevar tu rendimiento al siguiente nivel.</p>
    <p>Como miembro de nuestra comunidad, tendrás acceso a:</p>
    <ul style="text-align: left; display: inline-block; color: #444; margin-bottom: 30px;">
      <li>🚀 Lanzamientos exclusivos</li>
      <li>⚡ Ofertas especiales</li>
      <li>🏆 Acumulación de puntos de lealtad</li>
    </ul>
    <div>
      <a href="${process.env.FRONTEND_URL}" class="button">Explorar Tienda</a>
    </div>
  </div>
`);

export const verificationTemplate = (name, link) => baseTemplate(`
  <div style="text-align: center;">
    <h2>Verifica tu Cuenta</h2>
    <p>Hola ${name}, para completar tu registro y asegurar tu cuenta, por favor verifica tu correo electrónico.</p>
    <div style="margin: 30px 0;">
      <a href="${link}" class="button">Verificar Email</a>
    </div>
    <p style="font-size: 12px; color: #888;">Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
  </div>
`);

export const passwordResetTemplate = (name, link) => baseTemplate(`
  <div style="text-align: center;">
    <h2>Recuperación de Contraseña</h2>
    <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva.</p>
    <div style="margin: 30px 0;">
      <a href="${link}" class="button">Restablecer Contraseña</a>
    </div>
    <p style="font-size: 12px; color: #888;">Este enlace expirará en 1 hora.</p>
  </div>
`);

export const orderConfirmationTemplate = (order) => baseTemplate(`
  <h2>¡Gracias por tu pedido!</h2>
  <p>Hola ${order.user.first_name}, hemos recibido tu pedido <span class="highlight">#${order.order_number}</span>.</p>
  
  <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-bottom: 15px; font-size: 18px;">Resumen del Pedido</h3>
    <table style="width: 100%; border-collapse: collapse;">
      ${order.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;">
            <strong>${item.product_name}</strong>
            <div style="font-size: 12px; color: #666;">Cant: ${item.quantity}</div>
          </td>
          <td style="text-align: right; padding: 10px 0;">$${item.price}</td>
        </tr>
      `).join('')}
      <tr>
        <td style="padding-top: 15px; font-weight: bold;">Total</td>
        <td style="text-align: right; padding-top: 15px; font-weight: bold; font-size: 18px;">$${order.total_amount}</td>
      </tr>
    </table>
  </div>

  <div style="text-align: center; margin-top: 30px;">
    <a href="${process.env.FRONTEND_URL}/pedido/${order.id}" class="button">Ver Detalles del Pedido</a>
  </div>
`);

export const orderStatusTemplate = (order, status) => {
  const statusMessages = {
    PROCESSING: 'Tu pedido está siendo preparado con cuidado.',
    SHIPPED: '¡Tu pedido va en camino! Prepárate.',
    DELIVERED: 'Tu pedido ha sido entregado. ¡A disfrutar!',
    CANCELLED: 'Tu pedido ha sido cancelado.',
  };

  return baseTemplate(`
    <div style="text-align: center;">
      <h2>Actualización de Estado</h2>
      <p>El estado de tu pedido <span class="highlight">#${order.order_number}</span> ha cambiado a:</p>
      <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #000;">${status}</div>
      <p>${statusMessages[status] || ''}</p>
      <div style="margin-top: 30px;">
        <a href="${process.env.FRONTEND_URL}/pedido/${order.id}" class="button">Rastrear Pedido</a>
      </div>
    </div>
  `);
};

export const promotionTemplate = (promotion) => baseTemplate(`
  <div style="text-align: center;">
    <h2 style="font-size: 28px; text-transform: uppercase; letter-spacing: 1px;">${promotion.title}</h2>
    
    ${promotion.image_url ? `
      <div style="margin: 25px 0;">
        <img src="${promotion.image_url}" alt="${promotion.title}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      </div>
    ` : ''}

    <p style="font-size: 16px; line-height: 1.8;">${promotion.description}</p>

    ${promotion.discount_percent ? `
      <div style="background-color: #000; color: #fff; padding: 15px 30px; display: inline-block; border-radius: 50px; margin: 20px 0; font-weight: bold; font-size: 20px;">
        ¡${promotion.discount_percent}% OFF!
      </div>
    ` : ''}

    <p style="font-size: 14px; color: #666;">
      Válido hasta: <strong>${new Date(promotion.end_date).toLocaleDateString()}</strong>
    </p>
    
    <div style="margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL}/promociones" class="button">Aprovechar Oferta</a>
    </div>
  </div>
`);

export const marketingTemplate = (title, message, imageUrl, link, linkText) => baseTemplate(`
  <div style="text-align: center;">
    <h2 style="font-size: 28px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">${title}</h2>
    
    ${imageUrl ? `
      <div style="margin: 25px 0;">
        <img src="${imageUrl}" alt="${title}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      </div>
    ` : ''}

    <div style="font-size: 16px; line-height: 1.8; color: #444; margin-bottom: 30px; text-align: left;">
      ${message.replace(/\n/g, '<br>')}
    </div>
    
    ${link ? `
      <div style="margin-top: 30px;">
        <a href="${link}" class="button">${linkText || 'Ver Más'}</a>
      </div>
    ` : ''}
  </div>
`);
