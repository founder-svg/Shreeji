import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { clientRepository } from '../repositories/clientRepository.js';
import { config } from '../config/env.js';

export const clientAuthController = {
  register: async (req, res, next) => {
    try {
      const {
        fullName,
        phone,
        email,
        password,
        clientId,
        agentCode,
      } = req.body;

      if (!fullName || !fullName.trim()) {
        return res.status(400).json({ success: false, error: 'Full name is required' });
      }

      if (!phone || !phone.trim() || phone.replace(/\D/g, '').length < 10) {
        return res.status(400).json({ success: false, error: 'Valid 10-digit mobile number is required' });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      }

      // Generate clean User ID if not manually entered
      const generatedClientId = (clientId && clientId.trim())
        ? clientId.trim()
        : `SHR-C${Math.floor(10000 + Math.random() * 90000)}`;

      // Check for collision with existing User ID, phone, or email
      const existingUser = await clientRepository.findByClientIdOrEmailOrPhone(generatedClientId);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User ID or client identifier is already taken. Please choose another.',
        });
      }

      const existingPhone = await clientRepository.findByClientIdOrEmailOrPhone(phone.trim());
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          error: 'An account with this phone number already exists. Please log in.',
        });
      }

      if (email && email.trim()) {
        const existingEmail = await clientRepository.findByClientIdOrEmailOrPhone(email.trim());
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            error: 'An account with this email address already exists. Please log in.',
          });
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const client = await clientRepository.createClientUser({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        clientId: generatedClientId,
        passwordHash,
        agentCode: agentCode ? agentCode.trim() : null,
      });

      const token = jwt.sign(
        {
          id: client.id,
          clientId: client.client_id || client.clientId,
          fullName: client.full_name || client.fullName,
          phone: client.phone,
          role: 'client',
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn || '30d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Client account created successfully. Welcome to Shreeji Commercial Portal.',
        token,
        client: {
          id: client.id,
          clientId: client.client_id || client.clientId,
          fullName: client.full_name || client.fullName,
          phone: client.phone,
          email: client.email,
          agentCode: client.agent_code || client.agentCode,
          role: client.role,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const identifier = (req.body.identifier || req.body.clientId || req.body.email || req.body.phone || '').trim();
      const { password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          error: 'User ID, Mobile number, or Email and Password are required',
        });
      }

      const client = await clientRepository.findByClientIdOrEmailOrPhone(identifier);
      if (!client) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. No client account found with this ID or number.',
        });
      }

      const hash = client.password_hash || client.passwordHash;
      const isMatch = await bcrypt.compare(password, hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Password does not match.',
        });
      }

      const token = jwt.sign(
        {
          id: client.id,
          clientId: client.client_id || client.clientId,
          fullName: client.full_name || client.fullName,
          phone: client.phone,
          role: 'client',
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn || '30d' }
      );

      // Check if client has already completed KYC
      const existingKyc = await clientRepository.findKycByClientUserId(client.id);

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        client: {
          id: client.id,
          clientId: client.client_id || client.clientId,
          fullName: client.full_name || client.fullName,
          phone: client.phone,
          email: client.email,
          agentCode: client.agent_code || client.agentCode,
          role: client.role,
          hasKyc: !!existingKyc,
          kycStatus: existingKyc ? (existingKyc.verification_status || existingKyc.verificationStatus) : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  me: async (req, res, next) => {
    try {
      const client = await clientRepository.findById(req.user.id);
      if (!client) {
        return res.status(404).json({ success: false, error: 'Client profile not found' });
      }

      const kyc = await clientRepository.findKycByClientUserId(client.id);

      return res.json({
        success: true,
        client: {
          id: client.id,
          clientId: client.client_id || client.clientId,
          fullName: client.full_name || client.fullName,
          phone: client.phone,
          email: client.email,
          agentCode: client.agent_code || client.agentCode,
          role: client.role,
          hasKyc: !!kyc,
          kycStatus: kyc ? (kyc.verification_status || kyc.verificationStatus) : null,
          kycApplication: kyc || null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
