/**
 * Admin Users Page
 * Franco Sport E-Commerce
 * 
 * Gestión completa de usuarios - CONECTADO CON API
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { adminUsersService } from '@/api/admin';
import {
  Search,
  Filter,
  Eye,
  UserX,
  UserCheck,
  Mail,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Shield,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import type { User } from '@/types';

import { useConfirm } from '@/hooks/useConfirm';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    customers: 0,
    admins: 0,
  });
  const { confirm } = useConfirm();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter) filters.is_active = statusFilter === 'active';

      const response = await adminUsersService.getUsers(filters);
      setUsers(response.data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error?.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await adminUsersService.getUserStats();
      setStats({
        totalUsers: statsData.totalUsers,
        activeUsers: statsData.activeUsers,
        customers: statsData.customers,
        admins: statsData.admins,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [searchTerm, roleFilter, statusFilter]);

  // Toggle user status
  const handleToggleStatus = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmMessage = user.is_active
      ? '¿Estás seguro de que deseas desactivar este usuario?'
      : '¿Estás seguro de que deseas activar este usuario?';

    const isConfirmed = await confirm({
      title: user.is_active ? 'Desactivar Usuario' : 'Activar Usuario',
      message: confirmMessage,
      confirmText: user.is_active ? 'Desactivar' : 'Activar',
      variant: user.is_active ? 'danger' : 'warning'
    });

    if (!isConfirmed) return;

    try {
      await adminUsersService.toggleUserStatus(userId);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Error toggling status:', err);
      alert(err.response?.data?.error?.message || 'Error al cambiar estado del usuario');
    }
  };

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { color: string; bg: string }> = {
      ADMIN: { color: 'text-red-500', bg: 'bg-red-500/10' },
      MODERATOR: { color: 'text-purple-500', bg: 'bg-purple-500/10' },
      CUSTOMER: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
    };
    return configs[role] || configs.CUSTOMER;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      MODERATOR: 'Moderador',
      CUSTOMER: 'Cliente',
    };
    return labels[role] || role;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Usuarios</h1>
          <p className="text-neutral-400">
            Gestiona los usuarios y sus permisos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-medium text-neutral-400">Total Usuarios</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <UserCheck className="w-5 h-5 text-green-500" />
            <h4 className="text-sm font-medium text-neutral-400">Activos</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.activeUsers}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-medium text-neutral-400">Clientes</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.customers}</p>
        </div>

        <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="w-5 h-5 text-red-500" />
            <h4 className="text-sm font-medium text-neutral-400">Administradores</h4>
          </div>
          <p className="text-2xl font-black text-white">{stats.admins}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todos los roles</option>
            <option value="ADMIN">Administrador</option>
            <option value="MODERATOR">Moderador</option>
            <option value="CUSTOMER">Cliente</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-xl p-4">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-neutral-400">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No hay usuarios</h3>
            <p className="text-neutral-400">
              {searchTerm || roleFilter || statusFilter
                ? 'No se encontraron usuarios con los filtros seleccionados'
                : 'Aún no hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Usuario
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Email
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Rol
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Pedidos
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Total Gastado
                  </th>
                  <th className="text-left text-sm font-medium text-neutral-400 px-6 py-4">
                    Estado
                  </th>
                  <th className="text-right text-sm font-medium text-neutral-400 px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  const isActive = user.is_active;
                  const emailVerified = user.email_verified;

                  return (
                    <tr key={user.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">
                              {(user.first_name || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {user.first_name} {user.last_name}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-neutral-400">
                              <Calendar className="w-3 h-3" />
                              <span>Registrado {formatDate(user.created_at)}</span>
                              {emailVerified && (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Verificado</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-neutral-300">{user.email}</p>
                          {user.last_login ? (
                            <p className="text-xs text-neutral-500">
                              Último acceso: {formatDate(user.last_login)}
                            </p>
                          ) : (
                            <p className="text-xs text-neutral-500">Sin accesos recientes</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleBadge.bg} ${roleBadge.color}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-neutral-300">{(user as any).orders_count || 0}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">
                          ${((user as any).total_spent || 0).toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-500/10 text-neutral-500">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isActive
                                ? 'hover:bg-red-500/10 text-red-500'
                                : 'hover:bg-green-500/10 text-green-500'
                            }`}
                            title={isActive ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4 text-neutral-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
