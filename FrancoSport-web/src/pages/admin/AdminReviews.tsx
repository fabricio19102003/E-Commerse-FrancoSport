/**
 * Admin Reviews Page
 * Franco Sport E-Commerce
 * 
 * Moderación de reseñas de productos
 */

import React, { useEffect, useState } from 'react';
import { adminReviewsService } from '@/api/admin';
import type { Review } from '@/api/admin/reviews.service';
import {
  Search,
  Trash2,
  Loader2,
  Star,
  CheckCircle,
  MessageSquare,
  User,
  Package,
  Filter
} from 'lucide-react';

import { useConfirm } from '@/hooks/useConfirm';

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const { confirm } = useConfirm();
  
  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: any = { search: searchTerm };
      if (statusFilter === 'pending') filters.is_approved = false;
      if (statusFilter === 'approved') filters.is_approved = true;

      const response = await adminReviewsService.getReviews(filters);
      setReviews(response.data);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.response?.data?.error?.message || 'Error al cargar reseñas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [searchTerm, statusFilter]);

  // Handle Approve
  const handleApprove = async (id: number) => {
    try {
      await adminReviewsService.approveReview(id);
      fetchReviews();
    } catch (err: any) {
      console.error('Error approving review:', err);
      alert(err.response?.data?.error?.message || 'Error al aprobar reseña');
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Reseña',
      message: '¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await adminReviewsService.deleteReview(id);
      alert('Reseña eliminada exitosamente');
      fetchReviews();
    } catch (err: any) {
      console.error('Error deleting review:', err);
      alert(err.response?.data?.error?.message || 'Error al eliminar reseña');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-neutral-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Reseñas</h1>
          <p className="text-neutral-400">
            Modera las opiniones de los clientes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por comentario, usuario o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-neutral-400">Cargando reseñas...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center bg-[#1A1A1A] border border-neutral-800 rounded-xl">
            <MessageSquare className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No hay reseñas</h3>
            <p className="text-neutral-400">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron reseñas con los filtros seleccionados'
                : 'Aún no hay reseñas de clientes'}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6 transition-colors hover:border-neutral-700"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Info */}
                <div className="md:w-1/4 space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                      {review.product.images[0] ? (
                        <img
                          src={review.product.images[0].url}
                          alt={review.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-full h-full p-3 text-neutral-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-2">
                        {review.product.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1">ID: {review.product.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-neutral-400">
                    <User className="w-4 h-4" />
                    <span>{review.user.first_name} {review.user.last_name}</span>
                  </div>
                  
                  <div className="text-xs text-neutral-500">
                    {formatDate(review.created_at)}
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {renderStars(review.rating)}
                      {review.title && (
                        <h3 className="font-bold text-white">{review.title}</h3>
                      )}
                    </div>
                    <div>
                      {review.is_approved ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          Aprobada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-neutral-300 leading-relaxed">
                    {review.comment}
                  </p>

                  {review.is_verified_purchase && (
                    <div className="flex items-center space-x-1 text-xs text-green-500 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      <span>Compra verificada</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col justify-end gap-2 md:border-l md:border-neutral-800 md:pl-6">
                  {!review.is_approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Aprobar</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
