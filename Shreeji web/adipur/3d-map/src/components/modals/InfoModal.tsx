'use client';

import React from 'react';
import {
  X,
  Info,
  Trees,
  Shield,
  Zap,
  Droplets,
  Building2,
  Car,
  MapPin,
  Clock,
  Award,
  Sparkles,
} from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEnquiry: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  onOpenEnquiry,
}) => {
  if (!isOpen) return null;

  const keyAmenities = [
    {
      icon: <Trees className="w-5 h-5 text-emerald-400" />,
      title: 'Dense Fruit Orchards',
      desc: 'Plantation of 5000+ Mango, Teak, and Coconut trees with automated micro-drip irrigation.',
    },
    {
      icon: <Building2 className="w-5 h-5 text-teal-400" />,
      title: 'Grand Club & Sports Arena',
      desc: 'Swimming pool, Box cricket, Tennis court, Gymnasium, and community Satsang Hall.',
    },
    {
      icon: <Shield className="w-5 h-5 text-cyan-400" />,
      title: 'Gated 3-Tier Security',
      desc: '24/7 CCTV surveillance, boundary wall around whole perimeter, and biometric security gates.',
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      title: 'Underground Power & Fiber',
      desc: 'Concealed high-voltage cabling with dedicated step-down transformer and high-speed WiFi.',
    },
    {
      icon: <Droplets className="w-5 h-5 text-blue-400" />,
      title: '24x7 Pressurized Water',
      desc: 'Dual borewells, central overhead reservoir, and rain-water harvesting recharge pits.',
    },
    {
      icon: <Car className="w-5 h-5 text-purple-400" />,
      title: '40ft & 30ft Wide Roads',
      desc: 'Heavy-duty asphalt concrete roads with tree-lined curbs and solar street lamps.',
    },
  ];

  const connectivity = [
    { destination: 'Express Highway Junction', time: '12 Mins', distance: '8.5 km' },
    { destination: 'International Airport', time: '45 Mins', distance: '38 km' },
    { destination: 'Tech Park & Commercial Hub', time: '25 Mins', distance: '18 km' },
    { destination: 'Multi-Specialty Hospital', time: '15 Mins', distance: '11 km' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-3xl glass-panel rounded-3xl shadow-2xl border border-white/15 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Riva Meadows & Farms Overview
              </h2>
              <p className="text-xs text-gray-400">
                A pristine 120-acre sustainable farmland sanctuary offering titled plots with world-class amenities
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-left">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="block text-2xl font-black text-emerald-400">120+</span>
              <span className="text-[11px] text-gray-400 font-medium">Acres Township</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="block text-2xl font-black text-teal-400">182</span>
              <span className="text-[11px] text-gray-400 font-medium">Demarcated Plots</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="block text-2xl font-black text-cyan-400">45%</span>
              <span className="text-[11px] text-gray-400 font-medium">Green & Open Space</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="block text-2xl font-black text-amber-400">100%</span>
              <span className="text-[11px] text-gray-400 font-medium">Clear Title 7/12</span>
            </div>
          </div>

          {/* Master Amenities Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              World-Class Project Amenities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {keyAmenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
                    {amenity.icon}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-white">{amenity.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{amenity.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Location Advantage */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              Strategic Connectivity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {connectivity.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-gray-300">{item.destination}</span>
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <span>{item.distance}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-300 flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-teal-400" /> {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Clearances */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
            <Award className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200/90 space-y-1">
              <h4 className="font-bold text-sm text-emerald-300">
                100% Legally Verified & NA Sanctioned
              </h4>
              <p className="leading-relaxed">
                Clear marketable title, separate 7/12 extract for each individual plot, RERA registered layout, and bank loan facilities available with leading financial institutions.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/30 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-400">
            Phase 5A & 5B Booking Open • Immediate Registry
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenEnquiry();
            }}
            className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-95"
          >
            Enquire for Farmland
          </button>
        </div>
      </div>
    </div>
  );
};
