import { propertyInquiryRepository } from '../repositories/propertyInquiryRepository.js';
import { jobQueue } from '../jobs/jobQueue.js';

export const propertyInquiryController = {
  create: async (req, res, next) => {
    try {
      const { name, phone, role, propertyCategory, preferredLocation, message, builtupArea } = req.body;

      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          error: 'Name and phone number are required to submit an inquiry',
        });
      }

      // Basic phone format sanitation
      const cleanPhone = String(phone).replace(/[^\d+]/g, '');
      if (cleanPhone.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid 10-digit phone number',
        });
      }

      const inquiry = await propertyInquiryRepository.create({
        ...req.body,
        phone: cleanPhone,
      });

      // Enqueue lead notification / SMS / WhatsApp dispatch job
      jobQueue.enqueue('lead-notification', {
        inquiryId: inquiry.id,
        name: inquiry.name,
        phone: inquiry.phone,
        role: inquiry.role,
        propertyCategory: inquiry.propertyCategory || inquiry.property_category,
      });

      res.status(201).json({
        success: true,
        message: 'Your commercial inquiry has been registered successfully. Our property advisor will contact you.',
        data: {
          id: inquiry.id,
          name: inquiry.name,
          phone: inquiry.phone,
          status: inquiry.status,
          createdAt: inquiry.created_at || inquiry.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status, role } = req.query;
      const result = await propertyInquiryRepository.findAndCountAll({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        status,
        role,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const inquiry = await propertyInquiryRepository.findById(id);

      if (!inquiry) {
        return res.status(404).json({
          success: false,
          error: `Property inquiry '${id}' not found`,
        });
      }

      res.json({
        success: true,
        data: inquiry,
      });
    } catch (err) {
      next(err);
    }
  },

  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, assignedStaffId, notes } = req.body;

      const validStatuses = [
        'new',
        'contacted',
        'site_visit_scheduled',
        'negotiation',
        'closed_won',
        'closed_lost',
      ];

      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }

      const updated = await propertyInquiryRepository.updateStatus(id, {
        status,
        assignedStaffId,
        notes,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: `Property inquiry '${id}' not found`,
        });
      }

      res.json({
        success: true,
        message: 'Inquiry status updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
