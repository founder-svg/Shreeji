import { config } from '../config/env.js';
import { whatsappDispatchRepository } from '../repositories/whatsappDispatchRepository.js';
import { jobQueue } from '../jobs/jobQueue.js';

export const whatsappService = {
  getRecipientPhone: () => config.whatsapp.salesRecipientPhone || '919825799754',
  getDisplayPhone: () => config.whatsapp.salesDisplayPhone || '+91 98257 99754',

  /**
   * Format structured KYC & Plot reservation message for WhatsApp
   */
  formatKycMessage: ({ application, clientUser, maskedAadhar }) => {
    const timeStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const plotNo = application.interested_plot_number || application.interestedPlotNumber || 'Standard Master Layout';
    const plotArea = application.interested_plot_area || application.interestedPlotArea || '180 Sq.Yards';
    const plotVal = application.interested_plot_value || application.interestedPlotValue || 'Market Valuation';
    const agent = application.agent_code || application.agentCode || 'Direct Client';
    const company = application.company_name || application.companyName || 'Private Practice';
    const occupation = application.occupation || 'Business / Investor';
    const street = application.address_street || application.addressStreet || '';
    const city = application.city || 'Gandhidham';
    const pincode = application.pincode || '370201';

    return (
      `🏛️ *SHREEJI REAL ESTATE CONSULTANT*\n` +
      `*New Verified Client KYC & Plot Reservation*\n` +
      `----------------------------------------\n` +
      `📋 *Application Ref:* ${application.id}\n` +
      `👤 *Client ID:* ${clientUser?.clientId || 'SHR-CLIENT'}\n` +
      `👤 *Full Name:* ${application.full_name || application.fullName}\n` +
      `📞 *Client Phone:* ${application.phone}\n` +
      `🏠 *Address:* ${street}, ${city} (${pincode})\n` +
      `💼 *Work / Business:* ${occupation} (${company})\n` +
      `🪪 *Masked Aadhar:* ${maskedAadhar}\n\n` +
      `📍 *RESERVED PROPERTY PARCEL*\n` +
      `----------------------------------------\n` +
      `🏷️ *Project:* Nagavaladiya Residency (Survey 374)\n` +
      `📐 *Plot Number:* #${plotNo}\n` +
      `📏 *Plot Area:* ${plotArea}\n` +
      `💵 *Estimated Value:* ${plotVal}\n` +
      `🤝 *Agent Referral Code:* ${agent}\n\n` +
      `⏱️ *Application Time:* ${timeStr} IST\n` +
      `----------------------------------------\n` +
      `_Sent via Shreeji Digital Twin Spatial Platform_`
    );
  },

  /**
   * Format general commercial property inquiry message
   */
  formatInquiryMessage: ({ inquiry }) => {
    const timeStr = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const roleLabel = inquiry.role ? inquiry.role.toUpperCase() : 'BUYER / TENANT';
    const category = inquiry.propertyCategory || inquiry.property_category || 'Commercial Real Estate';
    const location = inquiry.preferredLocation || inquiry.preferred_location || 'Gandhidham / Adipur';
    const budget = inquiry.budget_or_expected || inquiry.budgetOrExpected || 'Flexible';

    return (
      `🏢 *SHREEJI REAL ESTATE CONSULTANT*\n` +
      `*New Commercial Property Inquiry*\n` +
      `----------------------------------------\n` +
      `📋 *Inquiry ID:* ${inquiry.id}\n` +
      `👤 *Contact Person:* ${inquiry.name}\n` +
      `📞 *Phone Number:* ${inquiry.phone}\n` +
      `🏷️ *Category:* ${category}\n` +
      `🎯 *Role:* ${roleLabel}\n` +
      `📍 *Target Location:* ${location}\n` +
      `💰 *Budget / Expected:* ${budget}\n` +
      (inquiry.message ? `📝 *Requirements:* ${inquiry.message}\n` : '') +
      `⏱️ *Inquiry Time:* ${timeStr} IST\n` +
      `----------------------------------------\n` +
      `_Shreeji Commercial Sales Team Dispatch_`
    );
  },

  /**
   * Generate links and store dispatch record into database
   */
  dispatchAndLog: async ({
    kycApplicationId = null,
    inquiryId = null,
    clientName,
    clientPhone,
    messageType = 'kyc_reservation',
    propertyRef = null,
    agentCode = null,
    messageText,
  }) => {
    const recipient = whatsappService.getRecipientPhone();
    const encodedText = encodeURIComponent(messageText);

    const directUrl = `https://wa.me/${recipient}?text=${encodedText}`;
    const webUrl = `https://web.whatsapp.com/send?phone=${recipient}&text=${encodedText}`;

    // Record in database
    const dispatchRecord = await whatsappDispatchRepository.create({
      kycApplicationId,
      inquiryId,
      recipientNumber: recipient,
      clientName,
      clientPhone,
      messageType,
      propertyRef,
      agentCode,
      messageBody: messageText,
      dispatchUrl: directUrl,
      deliveryChannel: 'whatsapp_direct',
      status: 'dispatched',
    });

    // Enqueue background audit / notification job
    try {
      jobQueue.enqueue('whatsapp-dispatch', {
        dispatchId: dispatchRecord.id,
        recipientPhone: recipient,
        clientName,
        clientPhone,
        messageType,
      });
    } catch (qErr) {
      // non-blocking
    }

    return {
      dispatchId: dispatchRecord.id,
      recipientPhone: recipient,
      displayPhone: whatsappService.getDisplayPhone(),
      directUrl,
      webUrl,
      messageBody: messageText,
    };
  },
};
