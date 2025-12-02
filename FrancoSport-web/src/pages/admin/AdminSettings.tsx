import React, { useState } from 'react';
import { Save, CreditCard, Truck, Store } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import toast from 'react-hot-toast';
import AdminPaymentSettings from './AdminPaymentSettings';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'shipping'>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Mock General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Franco Sport',
    supportEmail: 'contacto@francosport.com',
    supportPhone: '+591 70000000',
    address: 'Av. Principal #123, Santa Cruz, Bolivia',
    currency: 'BOB',
    taxRate: 13,
  });

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Configuración general guardada');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
        <p className="text-neutral-400">Administra la configuración general de tu tienda</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-[#1A1A1A] p-1 rounded-xl border border-neutral-800 w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'general'
              ? 'bg-primary text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>General</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'bg-primary text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Pagos</span>
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'shipping'
              ? 'bg-primary text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Envíos</span>
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'general' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Información de la Tienda</h2>
            <form onSubmit={handleGeneralSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Nombre de la Tienda</label>
                  <input
                    type="text"
                    value={generalSettings.storeName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Email de Soporte</label>
                  <input
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Teléfono de Soporte</label>
                  <input
                    type="text"
                    value={generalSettings.supportPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportPhone: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Moneda</label>
                  <input
                    type="text"
                    value={generalSettings.currency}
                    disabled
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-2 text-neutral-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Impuesto (%)</label>
                  <input
                    type="number"
                    value={generalSettings.taxRate}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, taxRate: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-neutral-800">
                <Button type="submit" disabled={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'payments' && (
          <AdminPaymentSettings />
        )}

        {activeTab === 'shipping' && (
          <Card className="p-6 text-center py-20">
            <Truck className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Configuración de Envíos</h3>
            <p className="text-neutral-400">Próximamente podrás gestionar zonas y métodos de envío aquí.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
