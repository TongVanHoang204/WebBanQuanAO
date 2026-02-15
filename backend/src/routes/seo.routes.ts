import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: SEO
 *   description: SEO Utilities
 */

/**
 * @swagger
 * /robots.txt:
 *   get:
 *     summary: Get robots.txt content
 *     tags: [SEO]
 *     responses:
 *       200:
 *         description: robots.txt file content
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

/**
 * Dynamic robots.txt handler
 * Checks 'seo_indexing' setting to determine whether to allow or disallow crawlers.
 */
router.get('/robots.txt', async (req, res) => {
  try {
    const setting = await prisma.$queryRaw<any[]>`SELECT value FROM settings WHERE \`key\` = 'seo_indexing' LIMIT 1`;
    const isIndexingAllowed = setting.length === 0 || setting[0].value === 'true';

    let content = '';
    if (isIndexingAllowed) {
      content = 'User-agent: *\nAllow: /\nSitemap: ' + (process.env.FRONTEND_URL || 'http://localhost:3000') + '/sitemap.xml';
    } else {
      content = 'User-agent: *\nDisallow: /';
    }

    res.type('text/plain');
    res.send(content);
  } catch (error) {
    console.error('[SEORoutes] Error generating robots.txt:', error);
    // Fallback to allow if DB fails, or disallow for safety? Let's allow.
    res.type('text/plain');
    res.send('User-agent: *\nAllow: /');
  }
});

export default router;
