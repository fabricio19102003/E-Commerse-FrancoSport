/**
 * Admin Users Page
 * Franco Sport E-Commerce
 * 
 * Gestión completa de usuarios - CONECTADO CON API
 */

import React, { useEffect, useState } from 'react';
import { adminUsersService } from '@/api/admin';
import {
  Search,
  UserX,
  UserCheck,
  Calendar,
  ShoppingCart,
  Users,
  Shield,
  Loader2,
  CheckCircle,
  Key,
  Edit,
  X
} from 'lucide-react';
import type { User } from '@/types';
import { Button, Card } from '@/components/ui';
import { useConfirm } from '@/hooks/useConfirm';
import toast from 'react-hot-toast';

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

  // Modals State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form State
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    phone: '',
    email_verified: false
  });
  const [passwordForm, setPasswordForm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const action = user.is_active ? 'desactivar' : 'activar';
    const confirmMessage = `¿Estás seguro de que deseas ${action} al usuario ${user.first_name} ${user.last_name}? \n\n${
      user.is_active 
        ? 'El usuario perderá acceso al sistema inmediatamente.' 
        : 'El usuario podrá volver a iniciar sesión en el sistema.'
    }`;

    const isConfirmed = await confirm({
      title: user.is_active ? 'Desactivar Usuario' : 'Activar Usuario',
      message: confirmMessage,
      confirmText: user.is_active ? 'Sí, Desactivar' : 'Sí, Activar',
      variant: user.is_active ? 'danger' : 'info'
    });

    if (!isConfirmed) return;

    try {
      await adminUsersService.toggleUserStatus(userId);
      toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'} correctamente`);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error('Error toggling status:', err);
      toast.error(err.response?.data?.error?.message || 'Error al cambiar estado del usuario');
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || 'CUSTOMER',
      phone: user.phone || '',
      email_verified: user.email_verified ?? false
    });
    setShowEditModal(true);
  };

  const handlePasswordClick = (user: User) => {
    setSelectedUser(user);
    setPasswordForm('');
    setShowPasswordModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      await adminUsersService.updateUser(selectedUser.id, editForm as any);
      toast.success('Usuario actualizado correctamente');
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error(err.response?.data?.error?.message || 'Error al actualizar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordForm.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminUsersService.changeUserPassword(selectedUser.id, passwordForm);
      toast.success('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.error?.message || 'Error al cambiar contraseña');
    } finally {
      setIsSubmitting(false);
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
                    Verificación
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
                        {emailVerified ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium border border-green-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Verificado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-medium border border-yellow-500/20">
                            <X className="w-3.5 h-3.5" />
                            <span>Pendiente</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
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
                            onClick={() => handleEditClick(user)}
                            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-blue-500"
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePasswordClick(user)}
                            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-yellow-500"
                            title="Cambiar contraseña"
                          >
                            <Key className="w-4 h-4" />
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

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-[#1A1A1A] border-neutral-800 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Editar Usuario</h3>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Rol</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="CUSTOMER">Cliente</option>
                    <option value="MODERATOR">Moderador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Verificación Email</label>
                  <select
                    value={editForm.email_verified ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, email_verified: e.target.value === 'true' })}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="true">Verificado</option>
                    <option value="false">No Verificado</option>
                  </select>
                </div>
              </div>

              {/* Read-only Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Fecha de Registro</label>
                  <p className="text-sm text-white">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Último Acceso</label>
                  <p className="text-sm text-white">
                    {selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Nunca'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting}>
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-[#1A1A1A] border-neutral-800 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Cambiar Contraseña</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-500">
                Estás cambiando la contraseña para el usuario <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordForm}
                  onChange={(e) => setPasswordForm(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting}>
                  Actualizar Contraseña
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
