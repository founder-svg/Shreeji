import { clientRepository } from '../repositories/clientRepository.js';
import { propertyInquiryRepository } from '../repositories/propertyInquiryRepository.js';
import { whatsappService } from '../services/whatsappService.js';

export const clientKycController = {
  submitKyc: async (req, res, next) => {
    try {
      const {
        fullName,
        phone,
        email,
        addressStreet,
        city,
        state,
        pincode,
        occupation,
        companyName,
        workDetails,
        annualIncomeOrBudget,
        aadharNumber,
        aadharDocumentUrl,
        aadharDocumentBackUrl,
        panNumber,
        interestedProjectId,
        interestedPlotNumber,
        interestedPlotArea,
        interestedPlotValue,
        agentCode,
      } = req.body;

      if (!fullName || !fullName.trim()) {
        return res.status(400).json({ success: false, error: 'Full name is required' });
      }

      if (!phone || !phone.trim() || phone.replace(/\D/g, '').length < 10) {
        return res.status(400).json({ success: false, error: 'Valid 10-digit mobile contact number is required' });
      }

      if (!addressStreet || !addressStreet.trim() || !city || !city.trim()) {
        return res.status(400).json({ success: false, error: 'Complete street address and city are required' });
      }

      if (!pincode || pincode.trim().length < 6) {
        return res.status(400).json({ success: false, error: 'Valid 6-digit postal pincode is required' });
      }

      const cleanAadhar = (aadharNumber || '').replace(/[\s-]/g, '').trim();
      if (!cleanAadhar || cleanAadhar.length !== 12 || !/^\d{12}$/.test(cleanAadhar)) {
        return res.status(400).json({
          success: false,
          error: 'Valid 12-digit UIDAI Aadhar card number is required',
        });
      }

      // Format masked Aadhar (e.g. XXXX-XXXX-1234) for security in records
      const maskedAadhar = `XXXX-XXXX-${cleanAadhar.slice(-4)}`;

      const kycApplication = await clientRepository.createKycApplication({
        clientUserId: req.user.id,
        clientId: req.user.clientId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        addressStreet: addressStreet.trim(),
        city: city.trim(),
        state: state ? state.trim() : 'Gujarat',
        pincode: pincode.trim(),
        occupation: occupation ? occupation.trim() : 'Business',
        companyName: companyName ? companyName.trim() : null,
        workDetails: workDetails ? workDetails.trim() : null,
        annualIncomeOrBudget: annualIncomeOrBudget ? annualIncomeOrBudget.trim() : null,
        aadharNumber: cleanAadhar,
        aadharDocumentUrl: aadharDocumentUrl || null,
        aadharDocumentBackUrl: aadharDocumentBackUrl || null,
        panNumber: panNumber ? panNumber.toUpperCase().trim() : null,
        interestedProjectId: interestedProjectId || 'nagavaladiya-374',
        interestedPlotNumber: interestedPlotNumber ? String(interestedPlotNumber) : null,
        interestedPlotArea: interestedPlotArea || null,
        interestedPlotValue: interestedPlotValue || null,
        agentCode: agentCode || req.user.agentCode || null,
      });

      // Automatically sync to Property Inquiries / CRM Pipeline for immediate sales follow-up
      try {
        await propertyInquiryRepository.create({
          name: fullName.trim(),
          phone: phone.trim(),
          email: email ? email.trim() : null,
          role: 'investor',
          property_category: 'Commercial Plot Parcel',
          preferred_location: city.trim(),
          budget_or_expected: interestedPlotValue || annualIncomeOrBudget || 'Market Valuation',
          builtup_area: interestedPlotArea || '180 Sq.Yards',
          message: `[KYC VERIFIED APPLICATION - ${kycApplication.id}]\nClient ID: ${req.user.clientId}\nAadhar: ${maskedAadhar}\nProfession: ${occupation || 'Business'}\nCompany: ${companyName || 'Self-Employed'}\nSelected Plot #${interestedPlotNumber || 'General Layout'}\nAgent Referral: ${agentCode || 'Direct Client'}`,
          source: 'kyc_portal',
          status: 'new',
        });
      } catch (crmErr) {
        console.warn('[KYC] Non-blocking warning: CRM lead auto-sync could not complete:', crmErr.message);
      }

      // Generate structured WhatsApp sales message payload and log dispatch in database (Phase 3)
      const waMessageText = whatsappService.formatKycMessage({
        application: kycApplication,
        clientUser: req.user,
        maskedAadhar,
      });

      const waDispatch = await whatsappService.dispatchAndLog({
        kycApplicationId: kycApplication.id,
        clientName: fullName.trim(),
        clientPhone: phone.trim(),
        messageType: 'kyc_reservation',
        propertyRef: `Plot #${interestedPlotNumber || 'Standard'} (${interestedPlotArea || '180 Sq.Yds'})`,
        agentCode: agentCode || 'Direct Client',
        messageText: waMessageText,
      });

      return res.status(201).json({
        success: true,
        message: 'Client KYC verification submitted successfully',
        application: {
          id: kycApplication.id,
          clientId: req.user.clientId,
          fullName: kycApplication.full_name || kycApplication.fullName,
          phone: kycApplication.phone,
          maskedAadhar,
          verificationStatus: 'pending',
          interestedPlotNumber: kycApplication.interested_plot_number || kycApplication.interestedPlotNumber,
          interestedPlotArea: kycApplication.interested_plot_area || kycApplication.interestedPlotArea,
          interestedPlotValue: kycApplication.interested_plot_value || kycApplication.interestedPlotValue,
          agentCode: kycApplication.agent_code || kycApplication.agentCode,
          createdAt: kycApplication.created_at || kycApplication.createdAt,
        },
        whatsAppDispatch: {
          dispatchId: waDispatch.dispatchId,
          phoneNumber: waDispatch.recipientPhone,
          displayPhone: waDispatch.displayPhone,
          directUrl: waDispatch.directUrl,
          webUrl: waDispatch.webUrl,
          messagePreview: waDispatch.messageBody,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  getStatus: async (req, res, next) => {
    try {
      const kyc = await clientRepository.findKycByClientUserId(req.user.id);
      if (!kyc) {
        return res.json({
          success: true,
          hasKyc: false,
          status: null,
          message: 'No KYC application submitted yet for this client account.',
        });
      }

      const cleanAadhar = kyc.aadhar_number || kyc.aadharNumber || '';
      const maskedAadhar = cleanAadhar.length >= 4 ? `XXXX-XXXX-${cleanAadhar.slice(-4)}` : 'XXXX-XXXX';

      return res.json({
        success: true,
        hasKyc: true,
        status: kyc.verification_status || kyc.verificationStatus,
        application: {
          id: kyc.id,
          fullName: kyc.full_name || kyc.fullName,
          phone: kyc.phone,
          email: kyc.email,
          city: kyc.city,
          occupation: kyc.occupation,
          companyName: kyc.company_name || kyc.companyName,
          maskedAadhar,
          interestedPlotNumber: kyc.interested_plot_number || kyc.interestedPlotNumber,
          interestedPlotArea: kyc.interested_plot_area || kyc.interestedPlotArea,
          interestedPlotValue: kyc.interested_plot_value || kyc.interestedPlotValue,
          verificationStatus: kyc.verification_status || kyc.verificationStatus,
          adminNotes: kyc.admin_notes || kyc.adminNotes,
          createdAt: kyc.created_at || kyc.createdAt,
          verifiedAt: kyc.verified_at || kyc.verifiedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  adminGetAllKyc: async (req, res, next) => {
    try {
      const { status, page, limit, search } = req.query;
      const data = await clientRepository.getAllKycApplications({
        status: status ? String(status).toLowerCase() : undefined,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        search: search ? String(search).trim() : undefined,
      });

      return res.json({
        success: true,
        data: data.applications,
        pagination: data.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  adminUpdateKycStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const allowedStatuses = ['pending', 'in_review', 'verified', 'rejected'];
      if (!status || !allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Status must be one of: ${allowedStatuses.join(', ')}`,
        });
      }

      const updated = await clientRepository.updateKycStatus(id, {
        status: status.toLowerCase(),
        adminNotes,
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'KYC application not found' });
      }

      return res.json({
        success: true,
        message: `KYC application status updated to '${status.toLowerCase()}'`,
        application: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};

