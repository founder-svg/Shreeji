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

      let adminUser = await adminRepository.findByEmail(identifier);

      // Support predefined client/estate administrator accounts
      if (!adminUser) {
        if (identifier === 'admin@shreeji.com' && (password === 'shreeji123' || password === config.admin.password)) {
          adminUser = {
            id: 'admin-shreeji-master',
            email: 'admin@shreeji.com',
            name: 'Shreeji Master Administrator',
            role: 'admin',
          };
        } else if (identifier === 'admin@regalfarms.com' && password === 'admin123') {
          adminUser = {
            id: 'admin-regal-farms',
            email: 'admin@regalfarms.com',
            name: 'Regal Farms Estate Administrator',
            role: 'admin',
          };
        }
      }

      if (!adminUser) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Check password if hash exists
      if (adminUser.password_hash || adminUser.passwordHash) {
        const isMatch = await bcrypt.compare(password, adminUser.password_hash || adminUser.passwordHash);
        if (!isMatch) {
          // Allow fallback for shreeji123 on admin@shreeji.com
          if (identifier === 'admin@shreeji.com' && password === 'shreeji123') {
            // authorized
          } else {
            return res.status(401).json({
              success: false,
              error: 'Invalid email or password',
            });
          }
        }
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
