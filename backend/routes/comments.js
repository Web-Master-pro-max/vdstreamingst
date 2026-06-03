const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'infinx_anime_jwt_secret_key_9981';

// Optional auth helper to check if a user is logged in (for computing isLiked)
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore and proceed unauthenticated
  }
  next();
}

// 1. Get all comments and replies for an episode
router.get('/episode/:episodeId', optionalAuthenticate, async (req, res) => {
  try {
    const episodeId = parseInt(req.params.episodeId);
    if (isNaN(episodeId)) {
      return res.status(400).json({ error: 'Invalid episode ID.' });
    }

    const comments = await prisma.comment.findMany({
      where: { episodeId },
      include: {
        user: {
          select: { id: true, email: true, role: true }
        },
        likes: true
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Format output with like counts and isLiked flag
    const formatted = comments.map(comment => {
      const isLiked = req.user ? comment.likes.some(like => like.userId === req.user.id) : false;
      const { likes, ...commentData } = comment;
      return {
        ...commentData,
        likesCount: likes.length,
        isLiked
      };
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
    const episodeId = parseInt(req.params.episodeId);
    const { content, parentId } = req.body;

    if (isNaN(episodeId)) {
      return res.status(400).json({ error: 'Invalid episode ID.' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: 'Comment content exceeds the 500-character limit.' });
    }

    // Resolve showId from the episode
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId }
    });

    if (!episode) {
      return res.status(404).json({ error: 'Episode not found.' });
    }

    const showId = episode.showId;

    // Verify parent comment exists if parentId is provided
    let parsedParentId = null;
    if (parentId) {
      parsedParentId = parseInt(parentId);
      if (isNaN(parsedParentId)) {
        return res.status(400).json({ error: 'Invalid parent comment ID.' });
      }
      const parentComment = await prisma.comment.findUnique({
        where: { id: parsedParentId }
      });
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found.' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        showId,
        episodeId,
        userId: req.user.id,
        content: content.trim(),
        parentId: parsedParentId
      },
      include: {
        user: {
          select: { id: true, email: true, role: true }
        },
        likes: true
      }
    });

    res.status(201).json({
      ...comment,
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

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Check if the user already liked the comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: req.user.id
        }
      }
    });

    if (existingLike) {
      // Unlike
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
      // Like
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

// 4. Pin/Unpin a comment (Admin only)
router.put('/:commentId/pin', authenticate, requireAdmin, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID.' });
    }

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
          select: { id: true, email: true, role: true }
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
});

// 5. Delete a comment (Admin or Comment Owner)
router.delete('/:commentId', authenticate, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID.' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Check privileges: comment owner or admin
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
