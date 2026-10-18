const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'infinx_anime_jwt_secret_key_9981';

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (default role is USER)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'USER',
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const formattedUser = formatUserResponse(user);

    res.status(201).json({
      token,
      user: formattedUser,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

function formatUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username || (user.email ? user.email.split('@')[0] : 'OtakuFan'),
    role: user.role || 'USER',
    vipRank: user.vipRank || (user.role === 'ADMIN' ? 'HOKAGE_VIP' : 'GENIN'),
    level: user.level || 1,
    xp: user.xp || 0,
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || null,
    avatarFrame: user.avatarFrame || 'default',
    bannerUrl: user.bannerUrl || null,
    accentColor: user.accentColor || '#ff0055',
    topAnime: user.topAnime || [],
    isPrivate: Boolean(user.isPrivate)
  };
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Me endpoint (verify token and return user metadata)
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUserResponse(user) });
  } catch (e) {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
});

module.exports = router;
