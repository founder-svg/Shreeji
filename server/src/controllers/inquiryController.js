import { v4 as uuidv4 } from 'uuid';
import { inquiryRepository } from '../repositories/inquiryRepository.js';

export const inquiryController = {
  // GET /api/inquiries (Admin Protected)
  getAll: async (req, res, next) => {
    try {
      const inquiries = await inquiryRepository.findAll();
      res.json({
        success: true,
        count: inquiries.length,
        data: inquiries,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/inquiries (Public, Rate Limited)
  create: async (req, res, next) => {
    try {
      const { name, email, phone, subject, message, productId } = req.body;

      const newInquiry = {
        id: `INQ-${Date.now().toString().slice(-8)}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : '',
        subject: subject ? subject.trim() : 'General Inquiry / Bridal Consultation',
        message: message.trim(),
        productId: productId || null,
        status: 'unread',
        createdAt: new Date().toISOString(),
      };

      const created = await inquiryRepository.create(newInquiry);

      res.status(201).json({
        success: true,
        message: 'Thank you for your inquiry! Our royal couture team will contact you shortly.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },
};
