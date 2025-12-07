import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getActivePosts = async (req, res) => {
  try {
    const posts = await prisma.communityPost.findMany({
      where: { is_active: true },
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' }
      ]
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching active community posts:', error);
    res.status(500).json({ message: 'Error al obtener las publicaciones de la comunidad' });
  }
};
