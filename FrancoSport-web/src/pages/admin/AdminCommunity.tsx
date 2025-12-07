import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, X, Save, Users } from 'lucide-react';
import api from '@/api/axios';

interface CommunityPost {
  id: number;
  title: string;
  category: string;
  description: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

interface CommunityFormData {
  title: string;
  category: string;
  description: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  imageFile?: FileList;
}

const AdminCommunity: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CommunityFormData>();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/admin/community');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Error al cargar las publicaciones');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: CommunityFormData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('category', data.category);
      formData.append('description', data.description);
      formData.append('is_active', String(data.is_active));
      formData.append('display_order', String(data.display_order));
      
      if (data.image_url) {
        formData.append('image_url', data.image_url);
      }

      if (data.imageFile && data.imageFile[0]) {
        formData.append('image', data.imageFile[0]);
      }

      if (isEditing && currentPostId) {
        await api.put(`/admin/community/${currentPostId}`, formData);
        toast.success('Publicación actualizada correctamente');
      } else {
        await api.post('/admin/community', formData);
        toast.success('Publicación creada correctamente');
      }

      resetForm();
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast.error(error.response?.data?.message || 'Error al guardar la publicación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (post: CommunityPost) => {
    setIsEditing(true);
    setCurrentPostId(post.id);
    setValue('title', post.title);
    setValue('category', post.category);
    setValue('description', post.description);
    setValue('image_url', post.image_url);
    setValue('is_active', post.is_active);
    setValue('display_order', post.display_order);
    setSelectedImagePreview(post.image_url);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta publicación?')) return;

    try {
      await api.delete(`/admin/community/${id}`);
      toast.success('Publicación eliminada correctamente');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error al eliminar la publicación');
    }
  };

  const resetForm = () => {
    reset({
      title: '',
      category: '',
      description: '',
      image_url: '',
      is_active: true,
      display_order: 0,
    });
    setSelectedImagePreview(null);
    setIsEditing(false);
    setCurrentPostId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Comunidad Franco Sport</h1>
          <p className="text-neutral-400">Gestiona las publicaciones de la sección "Nuestra Comunidad".</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              {isEditing ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              {isEditing ? 'Editar Publicación' : 'Nueva Publicación'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Título *</label>
                <input
                  {...register('title', { required: 'El título es obligatorio' })}
                  type="text"
                  className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ej: Bienvenido Astros de Pando"
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Categoría *</label>
                <input
                  {...register('category', { required: 'La categoría es obligatoria' })}
                  type="text"
                  className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ej: Futsal, Racing, Promoción"
                />
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Descripción *</label>
                <textarea
                  {...register('description', { required: 'La descripción es obligatoria' })}
                  rows={4}
                  className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Breve descripción..."
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Imagen</label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      {...register('imageFile')}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="community-image-upload"
                    />
                    <label
                      htmlFor="community-image-upload"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-primary hover:bg-neutral-800/50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-neutral-400 mr-2" />
                      <span className="text-neutral-400">Subir imagen</span>
                    </label>
                  </div>

                  {selectedImagePreview && (
                    <div className="relative w-full h-40 bg-neutral-900 rounded-lg overflow-hidden">
                      <img
                        src={selectedImagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImagePreview(null);
                          setValue('image_url', '');
                          setValue('imageFile', undefined);
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Display Order & Active */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Orden</label>
                  <input
                    {...register('display_order')}
                    type="number"
                    defaultValue={0}
                    className="w-full bg-[#0A0A0A] border border-neutral-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      {...register('is_active')}
                      type="checkbox"
                      defaultChecked={true}
                      className="form-checkbox h-5 w-5 text-primary rounded border-neutral-700 bg-[#0A0A0A] focus:ring-primary"
                    />
                    <span className="ml-2 text-white text-sm">Activo</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Publicaciones Activas ({posts.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0A0A0A] text-neutral-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Imagen</th>
                    <th className="px-6 py-3">Título / Categoría</th>
                    <th className="px-6 py-3">Orden</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                        No hay publicaciones registradas.
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-900">
                            {post.image_url ? (
                              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-600">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{post.title}</div>
                          <div className="text-sm text-neutral-400">{post.category}</div>
                          <div className="text-xs text-neutral-500 mt-1 truncate max-w-[200px]">{post.description}</div>
                        </td>
                        <td className="px-6 py-4 text-neutral-300">
                          {post.display_order}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.is_active 
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {post.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(post)}
                              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommunity;
