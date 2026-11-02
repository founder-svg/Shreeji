'use client';

import React, { useState } from 'react';
import { CombinedPlot } from '@/types';
import confetti from 'canvas-confetti';
import {
  X,
  MessageSquare,
  Phone,
  Send,
  CheckCircle2,
  Calendar,
  User,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  plot: CombinedPlot | null;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  onClose,
  plot,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    visitDate: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Please provide your name and contact phone number.');
      return;
    }

    setIsSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleWhatsApp = () => {
    const plotTitle = plot?.metadata.title || 'Farmland Plots';
    const text = encodeURIComponent(
      `Hello Riva Farms Team, I am interested in ${plotTitle} (${plot?.metadata.areaSqYd || '250'} sq.yd) with price ${plot?.metadata.price || 'approx ₹45 Lakhs'}. Please share the brochure and schedule a site visit.`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  const handleCall = () => {
    window.open('tel:+919876543210', '_self');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg glass-panel rounded-3xl shadow-2xl border border-white/15 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                {plot ? `Enquire for ${plot.metadata.title}` : 'Book Farmland Visit'}
              </h2>
              <p className="text-xs text-gray-400">
                {plot
                  ? `${plot.metadata.areaSqYd} sq.yd • ${plot.metadata.price} • ${plot.metadata.facing} Facing`
                  : 'Get instant brochure, pricing sheet & schedule a free cab site visit'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsSubmitted(false);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-left">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">
                  Enquiry Submitted Successfully!
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Thank you, <span className="text-emerald-300 font-semibold">{formData.name}</span>. Our senior real estate advisor will connect with you on <span className="text-white font-medium">{formData.phone}</span> within 15 minutes with complete plot documents and brochure.
                </p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-semibold"
                >
                  Back to Map
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Connect Options */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="p-3 rounded-2xl bg-emerald-900/30 border border-emerald-500/30 hover:bg-emerald-900/50 text-emerald-300 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md active:scale-98"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp Chat</span>
                </button>
                <button
                  type="button"
                  onClick={handleCall}
                  className="p-3 rounded-2xl bg-teal-900/30 border border-teal-500/30 hover:bg-teal-900/50 text-teal-300 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md active:scale-98"
                >
                  <Phone className="w-4 h-4 text-teal-400" />
                  <span>Call +91 98765 43210</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-3 text-[11px] text-gray-500 uppercase tracking-widest font-semibold">
                  Or Request a Site Visit
                </span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              <div className="space-y-3">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rajesh Patel"
                      className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Phone / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rajesh@example.com"
                        className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferred Visit Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Preferred Site Visit Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Notes / Specific Inquiries
                  </label>
                  <textarea
                    rows={2}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Ask about payment plans, registry timeline, or customized farmhouse construction..."
                    className="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 mt-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Booking Enquiry</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Your information is 100% confidential. No spam guaranteed.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
