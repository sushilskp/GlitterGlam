import React, { useState } from 'react';
import { Star, Send, CheckCircle, MessageSquareHeart } from 'lucide-react';
import { saveFeedback } from '../lib/featureStore';
import { Feedback } from '../types';

export default function FeedbackSection() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    const entry: Feedback = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim() || undefined,
      rating,
      message: message.trim(),
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      createdAt: new Date().toISOString(),
    };
    saveFeedback(entry);
    setSubmitted(true);
    setName(''); setEmail(''); setMessage(''); setRating(5);
    setTimeout(() => setSubmitted(false), 6000);
  }

  return (
    <section id="feedback" className="bg-[#1D1D1D] text-white py-12 sm:py-16 relative overflow-hidden border-t border-[#C9A66B]/15">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 0%, rgba(201,166,107,0.3) 0%, transparent 40%), radial-gradient(circle at 90% 100%, rgba(201,166,107,0.2) 0%, transparent 40%)' }} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8">
          <MessageSquareHeart className="w-8 h-8 text-[#C9A66B] mx-auto mb-3" />
          <span className="text-[10px] uppercase tracking-[0.35em] text-[#C9A66B] font-bold">Your Voice Matters</span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#F6E8D1] font-bold mt-2">Share Your Feedback</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 max-w-xl mx-auto">
            Loved a piece? Had an issue? Tell us — your feedback shapes our next collection and helps us serve you better.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-8 space-y-4">
          {submitted && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 rounded text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Thank you! Your feedback is saved. The founders read every message.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="px-4 py-2.5 bg-white/10 border border-white/15 rounded text-sm text-white placeholder-stone-400 focus:outline-none focus:border-[#C9A66B]"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional, for reply)"
              className="px-4 py-2.5 bg-white/10 border border-white/15 rounded text-sm text-white placeholder-stone-400 focus:outline-none focus:border-[#C9A66B]"
            />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#C9A66B] font-bold mb-2">How was your experience?</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  type="button"
                  key={n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`Rate ${n} stars`}
                >
                  <Star className={`w-7 h-7 ${n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-600'}`} />
                </button>
              ))}
              <span className="ml-2 text-xs text-stone-300">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Could be better' : 'We will improve'}
              </span>
            </div>
          </div>

          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your experience, what you loved, and what we can improve..."
            className="w-full px-4 py-2.5 bg-white/10 border border-white/15 rounded text-sm text-white placeholder-stone-400 focus:outline-none focus:border-[#C9A66B] resize-none"
          />

          <button
            type="submit"
            className="w-full bg-[#C9A66B] hover:bg-[#A67C52] text-[#1D1D1D] py-3 text-xs uppercase tracking-widest font-bold rounded transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" /> Send Feedback
          </button>
          <p className="text-[10px] text-stone-500 text-center">
            Your message is stored locally on this device. We never share it with third parties.
          </p>
        </form>
      </div>
    </section>
  );
}