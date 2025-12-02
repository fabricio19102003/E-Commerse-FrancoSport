import React, { forwardRef } from 'react';
import type { Order } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportTemplateProps {
  order: Order;
  type: 'payment' | 'delivery' | 'invoice';
}

export const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ order, type }, ref) => {
    const title =
      type === 'payment'
        ? 'COMPROBANTE DE PAGO'
        : type === 'delivery'
        ? 'NOTA DE ENTREGA'
        : 'FACTURA COMERCIAL';

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-[800px] mx-auto text-black font-sans tracking-wide leading-relaxed"
        style={{ width: '800px', minHeight: '1000px' }} // Fixed width for consistent export
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-4">
          <div className="flex items-center gap-4">
            <img
              src="/assets/logo-login.jpg" // Using the logo we have
              alt="Franco Sport"
              className="w-20 h-20 object-contain rounded-full border border-gray-200"
            />
            <div>
              <h1 className="text-2xl font-black italic">
                FRANCO<span className="text-red-600">SPORT</span>
              </h1>
              <p className="text-sm text-gray-600">Ropa Deportiva y Accesorios</p>
              <p className="text-xs text-gray-500">Cobija, Pando - Bolivia</p>
              <p className="text-xs text-gray-500">+591 72922253</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800 uppercase">{title}</h2>
            <p className="text-sm text-gray-600">N° Orden: #{order.order_number}</p>
            <p className="text-sm text-gray-600">
              Fecha: {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-2 border-b border-gray-300 pb-1">
            Datos del Cliente
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-semibold">Nombre:</span> {order.customer?.name}</p>
              <p><span className="font-semibold">Email:</span> {order.customer?.email}</p>
              <p><span className="font-semibold">Teléfono:</span> {order.customer?.phone || order.shipping_address?.phone || 'N/A'}</p>
            </div>
            <div>
              <p><span className="font-semibold">Dirección de Envío:</span></p>
              <p>{order.shipping_address?.street_address}</p>
              <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="py-3 px-4 text-left rounded-tl-lg">Producto</th>
                <th className="py-3 px-4 text-center">Cant.</th>
                <th className="py-3 px-4 text-right">Precio Unit.</th>
                <th className="py-3 px-4 text-right rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 px-4">
                    <p className="font-semibold">{item.product?.name || item.product_name}</p>
                    {item.variant && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.variant.attributes.color} / {item.variant.attributes.size}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">{item.quantity}</td>
                  <td className="py-4 px-4 text-right">
                    {formatCurrency(Number(item.price_at_purchase))}
                  </td>
                  <td className="py-4 px-4 text-right font-medium">
                    {formatCurrency(Number(item.price_at_purchase) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
              <span className="text-gray-600">Envío:</span>
              <span className="font-medium">{formatCurrency(Number(order.shipping_cost))}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-800 text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(Number(order.total_amount))}</span>
            </div>
          </div>
        </div>

        {/* Footer / Notes */}
        <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
          <p className="mb-2">Gracias por su preferencia.</p>
          <p>Para cualquier consulta, contáctenos al soporte.</p>
          {type === 'delivery' && (
            <div className="mt-12 flex justify-between px-12">
              <div className="border-t border-black w-40 pt-2">
                <p>Entregado por</p>
              </div>
              <div className="border-t border-black w-40 pt-2">
                <p>Recibido por</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ReportTemplate.displayName = 'ReportTemplate';
