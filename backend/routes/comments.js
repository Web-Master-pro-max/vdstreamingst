const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'infinx_anime_jwt_secret_key_9981';

const DATA_DIR = path.join(__dirname, '..', 'data');
const ANIME_COMMENTS_FILE = path.join(DATA_DIR, 'anime_comments.json');

function getAnimeCommentsStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(ANIME_COMMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(ANIME_COMMENTS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading anime_comments.json:', err);
  }
  return {};
}

function saveAnimeCommentsStore(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ANIME_COMMENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving anime_comments.json:', err);
  }
}

// Optional auth helper to check if a user is logged in (for computing isLiked)
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const uid = decoded.userId || decoded.id;
      if (uid) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(uid) }
        });
        if (user && !user.isBanned) {
          req.user = user;
        }
      }
    }
  } catch (error) {
    // Ignore and proceed unauthenticated
  }
  next();
}

// 1. Get all comments and replies for an episode (Supports DB IDs and Anime string keys like lunar-1735-1)
router.get('/episode/:episodeId', optionalAuthenticate, async (req, res) => {
  try {
    const rawEpId = String(req.params.episodeId || '').trim();
    if (!rawEpId) {
      return res.status(400).json({ error: 'Invalid episode ID.' });
    }

    const isNumeric = /^\d+$/.test(rawEpId);
    let comments = [];

    if (isNumeric) {
      try {
        const dbComments = await prisma.comment.findMany({
          where: { episodeId: parseInt(rawEpId) },
          include: {
            user: {
              select: { id: true, email: true, username: true, role: true, vipRank: true }
            },
            likes: true
          },
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
          ]
        });

        if (dbComments && dbComments.length > 0) {
          comments = dbComments.map(comment => {
            const isLiked = req.user ? comment.likes.some(like => like.userId === req.user.id) : false;
            const { likes, ...commentData } = comment;
            return {
              ...commentData,
              likesCount: likes.length,
              isLiked
            };
          });
          return res.json(comments);
        }
      } catch (dbErr) {
        // Fall back to anime comments store
      }
    }

    // Anime comments store
    const store = getAnimeCommentsStore();
    const epComments = store[rawEpId] || [];

    const formatted = epComments.map(c => {
      const likesArr = Array.isArray(c.likes) ? c.likes : [];
      const isLiked = req.user ? likesArr.includes(req.user.id) : false;
      return {
        id: c.id,
        episodeId: rawEpId,
        userId: c.userId,
        user: c.user || {
          id: c.userId,
          email: c.userEmail || 'Shinobi@infinx.com',
          username: c.username || 'Shinobi',
          role: c.role || 'USER',
          vipRank: c.vipRank || 'GENIN'
        },
        content: c.content,
        isPinned: Boolean(c.isPinned),
        parentId: c.parentId || null,
        likesCount: likesArr.length,
        isLiked,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      };
    });

    // Pinned comments first, then newest first
    formatted.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// 2. Post a comment or reply to a comment for an episode
router.post('/episode/:episodeId', authenticate, async (req, res) => {
  try {
    const rawEpId = String(req.params.episodeId || '').trim();
    const { content, parentId } = req.body;

    if (!rawEpId) {
      return res.status(400).json({ error: 'Invalid episode ID.' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: 'Comment content exceeds the 500-character limit.' });
    }

    const isNumeric = /^\d+$/.test(rawEpId);
    let dbEpisode = null;

    if (isNumeric) {
      try {
        dbEpisode = await prisma.episode.findUnique({
          where: { id: parseInt(rawEpId) }
        });
      } catch (_) {}
    }

    if (dbEpisode) {
      let parsedParentId = null;
      if (parentId) {
        parsedParentId = parseInt(parentId);
        if (!isNaN(parsedParentId)) {
          const parentComment = await prisma.comment.findUnique({
            where: { id: parsedParentId }
          });
          if (!parentComment) {
            return res.status(404).json({ error: 'Parent comment not found.' });
          }
        }
      }

      const comment = await prisma.comment.create({
        data: {
          showId: dbEpisode.showId,
          episodeId: dbEpisode.id,
          userId: req.user.id,
          content: content.trim(),
          parentId: parsedParentId
        },
        include: {
          user: {
            select: { id: true, email: true, username: true, role: true, vipRank: true }
          },
          likes: true
        }
      });

      return res.status(201).json({
        ...comment,
        likesCount: 0,
        isLiked: false
      });
    }

    // Anime (Lunar) Episode Comment in anime_comments.json
    const store = getAnimeCommentsStore();
    if (!store[rawEpId]) store[rawEpId] = [];

    const commentId = Date.now() + Math.floor(Math.random() * 1000);
    const parsedParentId = parentId ? parseInt(parentId) : null;

    const newComment = {
      id: commentId,
      episodeId: rawEpId,
      userId: req.user.id,
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username || req.user.email.split('@')[0],
        role: req.user.role || 'USER',
        vipRank: req.user.vipRank || 'GENIN'
      },
      content: content.trim(),
      parentId: parsedParentId,
      isPinned: false,
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store[rawEpId].push(newComment);
    saveAnimeCommentsStore(store);

    res.status(201).json({
      ...newComment,
      likesCount: 0,
      isLiked: false
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. Toggle like/unlike on a comment
router.post('/:commentId/like', authenticate, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID.' });
    }

    // Check anime comments store first
    const store = getAnimeCommentsStore();
    let foundAnimeComment = null;
    let foundEpKey = null;

    for (const epKey in store) {
      const match = store[epKey].find(c => c.id === commentId);
      if (match) {
        foundAnimeComment = match;
        foundEpKey = epKey;
        break;
      }
    }

    if (foundAnimeComment) {
      if (!Array.isArray(foundAnimeComment.likes)) foundAnimeComment.likes = [];
      const idx = foundAnimeComment.likes.indexOf(req.user.id);
      let status = 'liked';
      if (idx >= 0) {
        foundAnimeComment.likes.splice(idx, 1);
        status = 'unliked';
      } else {
        foundAnimeComment.likes.push(req.user.id);
        status = 'liked';
      }
      foundAnimeComment.updatedAt = new Date().toISOString();
      saveAnimeCommentsStore(store);
      return res.json({ status, commentId, likesCount: foundAnimeComment.likes.length });
    }

    // DB comment fallback
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: req.user.id
        }
      }
    });

    if (existingLike) {
      await prisma.commentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId: req.user.id
          }
        }
      });
      res.json({ status: 'unliked', commentId });
    } else {
      await prisma.commentLike.create({
        data: {
          commentId,
          userId: req.user.id
        }
      });
      res.json({ status: 'liked', commentId });
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Helper for Pin/Unpin
async function handlePinComment(req, res) {
  try {
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID.' });
    }

    // Check anime comments store
    const store = getAnimeCommentsStore();
    for (const epKey in store) {
      const match = store[epKey].find(c => c.id === commentId);
      if (match) {
        match.isPinned = !match.isPinned;
        match.updatedAt = new Date().toISOString();
        saveAnimeCommentsStore(store);
        const likesArr = Array.isArray(match.likes) ? match.likes : [];
        return res.json({
          ...match,
          likesCount: likesArr.length,
          isLiked: likesArr.includes(req.user.id)
        });
      }
    }

    // Prisma fallback
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { isPinned: !comment.isPinned },
      include: {
        user: {
          select: { id: true, email: true, username: true, role: true, vipRank: true }
        },
        likes: true
      }
    });

    const isLiked = updated.likes.some(like => like.userId === req.user.id);
    const { likes, ...commentData } = updated;

    res.json({
      ...commentData,
      likesCount: likes.length,
      isLiked
    });
  } catch (error) {
    console.error('Error pinning comment:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// 4. Pin/Unpin a comment (Admin only) - supports both PUT and POST
router.put('/:commentId/pin', authenticate, requireAdmin, handlePinComment);
router.post('/:commentId/pin', authenticate, requireAdmin, handlePinComment);

// 5. Delete a comment (Admin or Comment Owner)
router.delete('/:commentId', authenticate, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID.' });
    }

    // Check anime comments store
    const store = getAnimeCommentsStore();
    for (const epKey in store) {
      const idx = store[epKey].findIndex(c => c.id === commentId);
      if (idx >= 0) {
        const comment = store[epKey][idx];
        if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
          return res.status(403).json({ error: 'Access denied. You do not have permission to delete this comment.' });
        }
        // Remove comment and any replies referencing this parentId
        store[epKey] = store[epKey].filter(c => c.id !== commentId && c.parentId !== commentId);
        saveAnimeCommentsStore(store);
        return res.json({ success: true, message: 'Comment deleted successfully.', commentId });
      }
    }

    // Prisma fallback
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. You do not have permission to delete this comment.' });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ success: true, message: 'Comment deleted successfully.', commentId });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
