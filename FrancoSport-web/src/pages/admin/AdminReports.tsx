import React, { useState, useEffect, useRef } from 'react';

import { Card, Button } from '@/components/ui';
import { getOrders } from '@/api/admin/orders.service';
import type { Order } from '@/types';
import { ReportTemplate } from '@/components/admin/reports/ReportTemplate';
import { FileText, Download, Search, Loader2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const AdminReports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedType, setSelectedType] = useState<'payment' | 'delivery'>('payment');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !selectedOrder) return;

    try {
      setIsGenerating(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        logging: false,
        useCORS: true, // For images
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`reporte-${selectedType}-${selectedOrder.order_number}.pdf`);
      toast.success('Reporte PDF descargado');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportImage = async (format: 'png' | 'jpg') => {
    if (!reportRef.current || !selectedOrder) return;

    try {
      setIsGenerating(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `reporte-${selectedType}-${selectedOrder.order_number}.${format}`;
      link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`);
      link.click();
      toast.success(`Imagen ${format.toUpperCase()} descargada`);
    } catch (error) {
      console.error(error);
      toast.error('Error al generar imagen');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Generación de Reportes</h1>
        <p className="text-neutral-400">
          Genera y descarga reportes de pedidos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Configuración
            </h2>

            {/* Report Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Reporte
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedType('payment')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    selectedType === 'payment'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary'
                  }`}
                >
                  Comprobante de Pago
                </button>
                <button
                  onClick={() => setSelectedType('delivery')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    selectedType === 'delivery'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary'
                  }`}
                >
                  Nota de Entrega
                </button>
              </div>
            </div>

            {/* Order Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Pedido
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por N° orden, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-800">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Cargando pedidos...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No se encontraron pedidos
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedOrder?.id === order.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          #{order.order_number}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {(() => {
                            const statusMap: Record<string, string> = {
                              PENDING: 'Pendiente',
                              PROCESSING: 'Procesando',
                              PAID: 'Pagado',
                              SHIPPED: 'Enviado',
                              DELIVERED: 'Entregado',
                              CANCELLED: 'Cancelado',
                              REFUNDED: 'Reembolsado',
                            };
                            return statusMap[order.status] || order.status;
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {order.customer?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Export Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleExportPDF}
                disabled={!selectedOrder || isGenerating}
                fullWidth
                className="flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Exportar PDF
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleExportImage('jpg')}
                  disabled={!selectedOrder || isGenerating}
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  JPG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportImage('png')}
                  disabled={!selectedOrder || isGenerating}
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  PNG
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="p-6 min-h-[600px] bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center overflow-auto">
            {selectedOrder ? (
              <div className="transform scale-[0.6] md:scale-[0.7] lg:scale-[0.8] origin-top transition-transform duration-300">
                <div className="shadow-2xl">
                  <ReportTemplate
                    ref={reportRef}
                    order={selectedOrder}
                    type={selectedType}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">Vista Previa del Reporte</h3>
                <p>Selecciona un pedido para generar el reporte</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
