import React, { useState } from 'react';
import { Scale, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export default function Policies() {
  const [activeTab, setActiveTab] = useState<'shipping' | 'refunds' | 'privacy' | 'terms'>('shipping');

  return (
    <section className="py-16 bg-[#FDFBF8] border-b border-[#C9A66B]/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header content section */}
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.35em] text-[#A67C52] font-semibold">Gold Standard Safeguards</span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1D1D1D] mt-2">Legal & Trust Center</h2>
          <div className="w-12 h-[1.5px] bg-[#C9A66B] mx-auto mt-4" />
        </div>

        {/* Tab Selector grids */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {[
            { id: 'shipping', label: 'Shipping Policy', icon: Truck },
            { id: 'refunds', label: 'Returns & Refunds', icon: RotateCcw },
            { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
            { id: 'terms', label: 'Terms & Conditions', icon: Scale }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 border rounded flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-semibold cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1D1D1D] text-white border-transparent shadow-md'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-[#C9A66B]/60'
                }`}
              >
                <TabIcon className="w-4 h-4 stroke-[1.8]" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Inner Context panel viewport */}
        <div className="glass-card p-6 sm:p-8 text-xs sm:text-sm text-gray-600 font-light tracking-wide leading-relaxed rounded-lg">
          
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <h3 className="font-serif text-lg text-[#1D1D1D] font-bold border-b pb-3 flex items-center gap-2">
                <span className="text-[#C9A66B]">✦</span> Shipping &amp; Delivery Policies
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                  <h4 className="font-serif text-sm font-semibold text-[#1D1D1D] mb-1">Processing Time</h4>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">
                    All orders are processed within 2–3 business days. Delivery typically takes 5–7 business days depending on your location.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                  <h4 className="font-serif text-sm font-semibold text-[#1D1D1D] mb-1">Cash on Delivery (COD)</h4>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">
                    If Cash on Delivery (COD) is not available, a local or regional alternative will be provided, and an additional non-refundable handling fee may apply. Orders must be confirmed via call/WhatsApp before dispatch.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                  <h4 className="font-serif text-sm font-semibold text-red-700 mb-1 flex items-center gap-1.5">
                    <span>⚠</span> Damaged in Transit
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">
                    We pack our jewellery with utmost care and secure materials. If you receive a damaged package, please do not accept it from the courier partner and notify us immediately.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'refunds' && (
            <div className="space-y-6">
              <h3 className="font-serif text-lg text-[#1D1D1D] font-bold border-b pb-3 flex items-center gap-2">
                <span className="text-[#C9A66B]">✦</span> Returns, Replacements &amp; Refunds
              </h3>

              <div className="space-y-4">
                <div className="p-5 bg-red-50/50 border border-red-205 rounded-sm">
                  <h4 className="font-serif text-sm font-bold text-red-900 mb-1 flex items-center gap-1.5">
                    <span>🎬</span> Unboxing Video is Strictly Mandatory
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    To claim a refund or replacement for missing or damaged items, a <strong className="font-semibold text-stone-900">continuous unboxing video</strong> (rendered from opening the courier seal to showing the defect) must be provided within 24 hours of delivery. No claims or complaints will be entertained without a continuous unboxing video.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                  <h4 className="font-serif text-sm font-semibold text-[#1D1D1D] mb-1">Non-Returnable Items</h4>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">
                    For strict hygiene reasons, earrings and nose rings cannot be returned or exchanged under any circumstances unless received in a damaged state with required video proof.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                  <h4 className="font-serif text-sm font-semibold text-[#1D1D1D] mb-1">Refund Mode</h4>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">
                    Approved refunds will be processed back to your original payment method or provided as Glitter Glam store credit within 7–10 working days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="font-serif text-lg text-[#1D1D1D] font-bold border-b pb-3 flex items-center gap-2">
                <span className="text-[#C9A66B]">✦</span> Patron Privacy Policy
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
                Your privacy is as precious as gold. Glitter Glam does not share customer credentials, phone numbers, or physical store locations with third-party advertising databases. Our core principles reflect absolute trust and safety:
              </p>
              
              <ul className="list-disc pl-5 space-y-2.5 text-xs sm:text-sm text-gray-600 font-light">
                <li>Address contacts are strictly provided to priority shipping partners (Delhivery, Shiprocket, BlueDart) to execute safe transit.</li>
                <li>Secure checkouts are processed dynamically over encrypted SSL protocols. No personal card numbers are saved on our servers.</li>
                <li>Subscriber email coordinates are protected and used solely to distribute brand collections, maintenance instructions, and VIP coupon drops.</li>
              </ul>
              <p className="text-[11px] text-gray-400 font-light mt-4">For any dynamic privacy concerns or personal record requests, write directly to: glitterglamofficialstore@gmail.com</p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6">
              <h3 className="font-serif text-lg text-[#1D1D1D] font-bold border-b pb-3 flex items-center gap-2">
                <span className="text-[#C9A66B]">✦</span> Terms and Conditions for Web
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                  <h4 className="font-serif text-sm font-semibold text-[#1D1D1D] mb-1">Handcrafted Variation</h4>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">
                    Since many artificial jewellery pieces are handcrafted, minor variations in color, design, and stone placement may occur. These are characteristic of artisan craftsmanship and are not considered defects.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                  <h4 className="font-serif text-sm font-semibold text-[#1D1D1D] mb-1">Color Accuracy</h4>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">
                    We display product colors as accurately as possible. However, the actual color you see depends on your screen monitor, ambient lighting, or phone display settings.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                  <h4 className="font-serif text-sm font-semibold text-[#1D1D1D] mb-1">Material &amp; Allergy Care</h4>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">
                    Our jewellery uses premium bases and fine materials like brass, copper, alloy, and artificial stones/beads. It is the buyer's sole responsibility to check specified materials if they have particularly sensitive skin or known metal allergies.
                  </p>
                </div>

                <div className="p-4 bg-amber-50/50 border border-[#C9A66B]/20 rounded-sm">
                  <h4 className="font-serif text-sm font-bold text-[#A67C52] mb-1">Product Maintenance &amp; Longevity</h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-light">
                    Artificial jewellery will naturally tarnish over time due to exposure to air, moisture, perfumes, and skin oils. We do not provide any warranty or guarantee on polish/plating lifetime, as longevity entirely depends on how the product is maintained.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 text-[11px] text-gray-400 font-light flex flex-col gap-1">
                <p>Glitter Glam Boutique • SAS Nagar, Mohali, Punjab – India</p>
                <p>Website platform users agree to follow these Terms of Sale during checkout and browse sessions.</p>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
