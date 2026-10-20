import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';

export const inquiryController = {
  // GET /api/inquiries
  getAll: async (req, res, next) => {
    try {
      const inquiries = await db.getInquiries();
      res.json({
        success: true,
        count: inquiries.length,
        data: inquiries,
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/inquiries
  create: async (req, res, next) => {
    try {
      const { name, email, phone, subject, message, productId } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          error: 'Name, email, and message are required',
        });
      }

      const newInquiry = {
        id: `INQ-${Date.now().toString().slice(-8)}`,
        name,
        email,
        phone: phone || '',
        subject: subject || 'General Inquiry / Bridal Consultation',
        message,
        productId: productId || null,
        status: 'unread',
        createdAt: new Date().toISOString(),
      };

      const created = await db.createInquiry(newInquiry);

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
