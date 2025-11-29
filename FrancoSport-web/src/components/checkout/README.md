# 💳 Checkout Components

Componentes del proceso de checkout (RF-019, RF-020).

## Componentes:
- `CheckoutSteps.tsx` - Indicador de pasos del checkout
- `ContactForm.tsx` - Formulario de información de contacto
- `ShippingForm.tsx` - Formulario de dirección de envío
- `ShippingMethods.tsx` - Selector de métodos de envío
- `PaymentForm.tsx` - Formulario de pago con Stripe
- `OrderSummary.tsx` - Resumen final del pedido
- `OrderConfirmation.tsx` - Página de confirmación

## Pasos del Checkout:
1. **Información de Contacto** - Email
2. **Dirección de Envío** - Dirección completa
3. **Método de Envío** - Selección de transportista
4. **Pago** - Integración con Stripe
5. **Confirmación** - Orden creada exitosamente

## Validaciones:
- React Hook Form + Zod schemas
- Validación en tiempo real
- Mensajes de error claros
