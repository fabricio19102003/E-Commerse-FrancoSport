/**
 * Admin Layout
 * Franco Sport E-Commerce
 * 
 * Layout principal para el panel administrativo
 */

import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Tag,
  Percent,
  Truck,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: ROUTES.ADMIN_DASHBOARD,
    },
    {
      label: 'Productos',
      icon: Package,
      path: ROUTES.ADMIN_PRODUCTS,
    },
    {
      label: 'Pedidos',
      icon: ShoppingCart,
      path: ROUTES.ADMIN_ORDERS,
    },
    {
      label: 'Usuarios',
      icon: Users,
      path: ROUTES.ADMIN_USERS,
    },
    {
      label: 'Categorías',
      icon: FolderTree,
      path: ROUTES.ADMIN_CATEGORIES,
    },
    {
      label: 'Marcas',
      icon: Tag,
      path: '/admin/marcas',
    },
    {
      label: 'Cupones',
      icon: Percent,
      path: '/admin/cupones',
    },
    {
      label: 'Envíos',
      icon: Truck,
      path: '/admin/envios',
    },
    {
      label: 'Reseñas',
      icon: Star,
      path: '/admin/resenas',
    },
    {
      label: 'Configuración',
      icon: Settings,
      path: '/admin/configuracion',
    },
  ];

  const isActive = (path: string) => {
    if (path === ROUTES.ADMIN_DASHBOARD) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-[#1A1A1A] border-r border-neutral-800 relative">
          {/* Collapse Button (Desktop) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-6 z-50 items-center justify-center w-6 h-6 bg-primary rounded-full text-black hover:bg-primary/90 transition-colors"
            title={isCollapsed ? 'Expandir' : 'Contraer'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Logo */}
          <div className={`flex items-center mb-8 px-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <Link to={ROUTES.HOME} className={`flex items-center ${isCollapsed ? 'flex-col' : 'space-x-3'}`}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-black font-black text-lg">F</span>
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-white font-black text-lg">Franco Sport</h1>
                  <span className="text-xs text-neutral-400 font-medium">Admin Panel</span>
                </div>
              )}
            </Link>
            {!isCollapsed && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                    isCollapsed ? 'justify-center' : 'space-x-3'
                  } ${
                    active
                      ? 'bg-primary text-black font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className={`absolute bottom-0 left-0 right-0 p-3 border-t border-neutral-800 bg-[#1A1A1A] ${
            isCollapsed ? 'flex flex-col items-center' : ''
          }`}>
            {!isCollapsed && (
              <div className="flex items-center space-x-3 px-3 py-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">
                    {user?.first_name?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-3 py-2 mt-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors ${
                isCollapsed ? 'justify-center' : 'justify-center space-x-2'
              }`}
              title={isCollapsed ? 'Cerrar Sesión' : ''}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-[#0A0A0A] border-b border-neutral-800">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-800 text-white"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center space-x-4 ml-auto">
                <Link
                  to={ROUTES.HOME}
                  target="_blank"
                  className="text-sm text-neutral-400 hover:text-primary transition-colors"
                >
                  Ver sitio web →
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
