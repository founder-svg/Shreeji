import { whatsappDispatchRepository } from '../repositories/whatsappDispatchRepository.js';
import { whatsappService } from '../services/whatsappService.js';

export const whatsappDispatchController = {
  /**
   * Log an outbound WhatsApp dispatch from client UI
   */
  recordDispatch: async (req, res, next) => {
    try {
      const {
        kycApplicationId,
        inquiryId,
        clientName,
        clientPhone,
        messageType = 'quick_inquiry',
        propertyRef,
        agentCode,
        messageText,
      } = req.body;

      if (!clientName || !clientPhone) {
        return res.status(400).json({
          success: false,
          error: 'Client name and phone number are required',
        });
      }

      const defaultText = messageText || `*INQUIRY REGISTRATION - SHREEJI*\nName: ${clientName}\nPhone: ${clientPhone}\nRef: ${propertyRef || 'General'}`;

      const dispatch = await whatsappService.dispatchAndLog({
        kycApplicationId,
        inquiryId,
        clientName,
        clientPhone,
        messageType,
        propertyRef,
        agentCode,
        messageText: defaultText,
      });

      return res.status(201).json({
        success: true,
        message: 'WhatsApp dispatch recorded successfully',
        data: dispatch,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin view for all logged WhatsApp sales dispatches
   */
  getAllDispatches: async (req, res, next) => {
    try {
      const { page = 1, limit = 50, recipient, status } = req.query;
      const result = await whatsappDispatchRepository.getAll({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 50,
        recipient,
        status,
      });

      return res.json({
        success: true,
        targetSalesNumber: whatsappService.getRecipientPhone(),
        targetDisplayNumber: whatsappService.getDisplayPhone(),
        data: result.dispatches,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

