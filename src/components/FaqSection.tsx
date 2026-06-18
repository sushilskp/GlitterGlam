import React, { useState } from 'react';
import { CreditCard, Truck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  id: 'payments' | 'shipping' | 'care';
  title: string;
  icon: React.ComponentType<any>;
  items: FaqItem[];
}

export default function FaqSection() {
  const [activeCategory, setActiveCategory] = useState<'payments' | 'shipping' | 'care'>('payments');
  const [openIndexes, setOpenIndexes] = useState<Record<string, boolean>>({});

  const toggleAccordion = (categoryId: string, index: number) => {
    const key = `${categoryId}-${index}`;
    setOpenIndexes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const faqData: FaqCategory[] = [
    {
      id: 'payments',
      title: 'Payments & Ordering',
      icon: CreditCard,
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept UPI (GPay, PhonePe, Paytm), Credit/Debit cards, and Net Banking to ensure safe, swift, and secure transactions.'
        },
        {
          question: 'Do you offer Cash on Delivery (COD)?',
          answer: 'We are sorry, we do not have an option for Cash on Delivery (COD) at the moment. We will try our best in the future to provide a secure COD facility.'
        },
        {
          question: 'Can I apply two discount codes together?',
          answer: 'No, only one coupon/discount code can be applied per order.'
        },
        {
          question: 'Can I change or cancel my order after placing it?',
          answer: 'You can cancel or modify your order within 2 hours of placing it by contacting our support team via WhatsApp or Email. Once the order is dispatched from our boutique, it cannot be canceled.'
        }
      ]
    },
    {
      id: 'shipping',
      title: 'Shipping, Delivery & Returns',
      icon: Truck,
      items: [
        {
          question: 'How can I track my order?',
          answer: 'Once shipped, we will send a real-time tracking link directly to your WhatsApp and email address.'
        },
        {
          question: 'Can I change my delivery address after ordering?',
          answer: 'Only if your order hasn’t been shipped from our facility yet. Please message us on WhatsApp with your order details immediately!'
        },
        {
          question: 'Do you ship internationally?',
          answer: 'Currently, we only ship across India.'
        },
        {
          question: 'What should I do if I receive a broken or damaged item?',
          answer: 'Don\'t worry! Please share a clear, unedited, continuous unboxing video showing the damage with our WhatsApp customer support within 24 hours of delivery, and we will send you a fresh replacement instantly.'
        }
      ]
    },
    {
      id: 'care',
      title: 'Materials, Quality & Care',
      icon: Sparkles,
      items: [
        {
          question: 'What materials are used in your jewellery?',
          answer: 'We utilize high-quality bases including refined brass, copper, premium alloys, and high-quality artificial stones or beads representing heritage luxury standards.'
        },
        {
          question: 'Is the jewellery lightweight?',
          answer: 'Yes! Most of our statement pieces are carefully designed to be lightweight and extremely comfortable for long hours of wear during your special occasions.'
        },
        {
          question: 'Is your jewellery safe for sensitive skin?',
          answer: 'Most of our pieces are made from premium, skin-friendly alloys. However, if you have extremely sensitive skin or a specific allergy to imitation metals, we highly recommend trying a smaller piece first or requesting our boutique\'s premium anti-tarnish / stainless steel collections.'
        },
        {
          question: 'How should I store my artificial jewellery?',
          answer: 'Always store your jewellery in a dry, airtight plastic pouch or zip-lock bag after use. Avoid storing multiple pieces together in a single container to prevent tangling, scratching, or premature wear.'
        },
        {
          question: 'Will the jewellery turn black or tarnish?',
          answer: 'All artificial and fashion statement jewellery naturally changes color over time when exposed to humidity, air, and skin chemistry. However, you can significantly extend its life and luxury luster by keeping it fully away from water, perfumes, sanitizers, and sweat.'
        },
        {
          question: 'Do you offer gift wrapping?',
          answer: 'Yes! You can add elegant gift wrapping and a personalized artisan greeting card at checkout for a small, nominal fee.'
        },
        {
          question: 'Do you restock sold-out items?',
          answer: 'Many of our highly popular articles do get restocked. Tap the "Notify Me" button on any product listing or turn on our Instagram notifications to receive immediate announcements!'
        }
      ]
    }
  ];

  const currentCategoryObj = faqData.find((cat) => cat.id === activeCategory);

  return (
    <div className="mt-12 bg-white rounded-lg border border-[#C9A66B]/15 shadow-sm overflow-hidden max-w-4xl mx-auto">
      {/* Category Tabs Header */}
      <div className="bg-[#1D1D1D] p-1 flex border-b border-[#C9A66B]/15">
        {faqData.map((category) => {
          const IconComponent = category.icon;
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 text-[11px] sm:text-xs uppercase tracking-wider font-bold transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-white text-[#1D1D1D] rounded-sm shadow'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#C9A66B]' : 'text-stone-400'}`} />
              <span className="hidden sm:inline">{category.title}</span>
              <span className="sm:hidden">
                {category.id === 'payments' ? 'Payments' : category.id === 'shipping' ? 'Shipping' : 'Materials'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Accordion List Body */}
      <div className="p-6 sm:p-8 bg-[#FDFBF8]/50 min-h-[350px]">
        <div className="space-y-4">
          {currentCategoryObj?.items.map((item, index) => {
            const compositeKey = `${activeCategory}-${index}`;
            const isOpen = !!openIndexes[compositeKey];

            return (
              <div
                key={index}
                className="border border-stone-200/65 rounded bg-white overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => toggleAccordion(activeCategory, index)}
                  className="w-full text-left p-4 sm:p-5 flex justify-between items-center gap-4 hover:bg-stone-50 cursor-pointer transition-colors duration-200"
                >
                  <span className="font-serif text-[13px] sm:text-sm font-bold text-[#1D1D1D] tracking-wide">
                    Q: {item.question}
                  </span>
                  <span className="text-[#C9A66B]/80 flex-shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {/* Smooth expandable collapsible panel */}
                <div
                  className={`transition-all duration-300 ease-in-out border-t border-stone-100 ${
                    isOpen ? 'max-h-96 opacity-100 p-4 sm:p-5 bg-stone-50/50' : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <p className="text-xs sm:text-[13px] text-stone-600 font-light leading-relaxed">
                    <strong className="font-semibold text-[#A67C52] mr-1">Answer:</strong>
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
