import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminRepository } from '../repositories/adminRepository.js';
import { config } from '../config/env.js';

export const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      const adminUser = await adminRepository.findByEmail(email.trim());
      if (!adminUser) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      const isMatch = await bcrypt.compare(password, adminUser.password_hash || adminUser.passwordHash);
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
