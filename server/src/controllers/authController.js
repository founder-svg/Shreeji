import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminRepository } from '../repositories/adminRepository.js';
import { config } from '../config/env.js';

export const authController = {
  login: async (req, res, next) => {
    try {
      const identifier = (req.body.email || req.body.username || '').trim().toLowerCase();
      const { password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email or username and password are required',
        });
      }

      const adminUser = await adminRepository.findByIdentifier(identifier);

      if (!adminUser) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      const passwordHash = adminUser.password_hash || adminUser.passwordHash;
      if (!passwordHash) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      const isMatch = await bcrypt.compare(password, passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate signed JWT token
      const tokenPayload = {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role || 'admin',
      };

      const token = jwt.sign(tokenPayload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });

      await adminRepository.updateLastLogin(adminUser.id);

      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        expiresIn: config.jwtExpiresIn,
        user: tokenPayload,
      });
    } catch (err) {
      next(err);
    }
  },

  me: async (req, res) => {
    res.json({
      success: true,
      user: req.user,
    });
  },
};
