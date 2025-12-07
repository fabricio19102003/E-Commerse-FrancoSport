import prisma from '../../utils/prisma.js';

export const getPosts = async (req, res) => {
  try {
    const posts = await prisma.communityPost.findMany({
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' }
      ]
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ message: 'Error al obtener las publicaciones de la comunidad' });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.communityPost.findUnique({
      where: { id: Number(id) }
    });

    if (!post) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching community post:', error);
    res.status(500).json({ message: 'Error al obtener la publicación' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, category, description, is_active, display_order } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
      image_url = req.file.path;
    }

    if (!image_url) {
      return res.status(400).json({ message: 'La imagen es requerida' });
    }

    const post = await prisma.communityPost.create({
      data: {
        title,
        category,
        description,
        image_url,
        is_active: is_active === 'true' || is_active === true,
        display_order: Number(display_order) || 0
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({ message: 'Error al crear la publicación' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, is_active, display_order } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
      image_url = req.file.path;
    }

    const dataToUpdate = {
      title,
      category,
      description,
      is_active: is_active === 'true' || is_active === true,
      display_order: Number(display_order)
    };

    if (image_url) {
      dataToUpdate.image_url = image_url;
    }

    const post = await prisma.communityPost.update({
      where: { id: Number(id) },
      data: dataToUpdate
    });

    res.json(post);
  } catch (error) {
    console.error('Error updating community post:', error);
    res.status(500).json({ message: 'Error al actualizar la publicación' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.communityPost.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Publicación eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting community post:', error);
    res.status(500).json({ message: 'Error al eliminar la publicación' });
  }
};
