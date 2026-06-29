import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { sendChat, listFreeModels, ChatTurn } from '../lib/aiChat';
import { loadChatHistory, saveChatHistory, clearChatHistory, ChatMessage } from '../lib/featureStore';

interface AIChatbotProps {
  products: Product[];
}

const SUGGESTED_PROMPTS = [
  'I need a bridal necklace set under ₹6,000',
  'Show me daily-wear earrings',
  'Recommend a gift for my sister',
  'Festive bangles in 1-gram gold',
];

const QUICK_FOLLOWUPS = [
  'Compare top picks',
  'Show me something under ₹2,000',
  'What goes with a red lehenga?',
];

// Show users a friendly label, not the raw model identifier.
const MODEL_LABELS: Record<string, string> = {
  'openrouter/free': 'Auto (best free model)',
  'liquid/lfm-2.5-1.2b-instruct-20260120:free': 'Liquid · 1.2B',
  'mistralai/mistral-small-3.2-24b-instruct:free': 'Mistral · 24B',
  'google/gemma-3-27b-it:free': 'Gemma 3 · 27B',
  'meta-llama/llama-3.3-70b-instruct:free': 'Llama 3.3 · 70B',
  'meta-llama/llama-3.1-8b-instruct:free': 'Llama 3.1 · 8B',
  'qwen/qwen-2.5-7b-instruct:free': 'Qwen 2.5 · 7B',
  'deepseek/deepseek-chat-v3-0324:free': 'DeepSeek V3',
};

function prettifyModelName(id: string): string {
  return MODEL_LABELS[id] || id;
}

export default function AIChatbot({ products }: AIChatbotProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState<string>(() => listFreeModels()[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [source, setSource] = useState<'openrouter' | 'offline' | 'unknown'>('unknown');
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory());

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist chat history whenever it changes.
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // Increment unread count when closed and assistant replies.
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Track unread count for new assistant turns.
  useEffect(() => {
    if (open) return;
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant') setUnread(n => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const productBySku = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.sku, p));
    return map;
  }, [products]);

  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      // Convert to the slim ChatTurn shape the API expects.
      const history: ChatTurn[] = nextMessages.map(m => ({ role: m.role as any, content: m.content }));
      const response = await sendChat(history, products, { model });
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        createdAt: new Date().toISOString(),
        productRefs: response.productRefs,
      };
      setMessages(prev => [...prev, aiMsg]);
      setSource(response.source);
    } catch (err) {
      console.error('chat send error', err);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Something went wrong on my end. Try again, or ask a slightly different question.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleClear() {
    if (!confirm('Clear the entire chat history?')) return;
    clearChatHistory();
    setMessages([]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI Stylist"
        className={`fixed z-40 bottom-5 right-4 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full bg-[#1D1D1D] text-[#F6E8D1] shadow-2xl flex items-center justify-center hover:bg-[#C9A66B] hover:text-white transition-all float-bob pulse-glow ${open ? 'scale-0 pointer-events-none' : 'scale-100'}`}
        title="Chat with our AI Stylist"
      >
        <Bot className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      <div
        role="dialog"
        aria-label="AI Stylist"
        className={`fixed z-50 inset-x-3 bottom-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#C9A66B]/20 overflow-hidden transition-all origin-bottom-right ${
          open ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1D1D1D] to-[#2a2a2a] text-[#FDFBF8] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C9A66B] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#1D1D1D]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm font-semibold leading-tight">Glitter Glam AI Stylist</p>
            <p className="text-[10px] text-[#C9A66B] uppercase tracking-widest">
              {source === 'openrouter' ? 'Personal Stylist · Online' : 'Personal Stylist · Ready'}
            </p>
          </div>
          <button
            onClick={handleClear}
            className="text-[10px] uppercase tracking-widest text-stone-300 hover:text-white px-2 py-1"
            title="Clear chat history"
          >
            Clear
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="text-stone-300 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model selector strip */}
        <div className="px-3 py-2 border-b border-stone-200 bg-stone-50 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#C9A66B]" />
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">AI Model</span>
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(s => !s)}
              className="text-[11px] text-stone-700 hover:text-[#C9A66B] truncate max-w-[260px]"
            >
              {prettifyModelName(model)}
            </button>
            {showModelMenu && (
              <div className="absolute z-10 mt-1 bg-white border border-stone-200 rounded shadow-lg max-h-60 overflow-y-auto">
                {listFreeModels().map(m => (
                  <button
                    key={m}
                    onClick={() => { setModel(m); setShowModelMenu(false); }}
                    className={`block w-full text-left text-[11px] px-3 py-1.5 hover:bg-stone-100 ${m === model ? 'text-[#C9A66B] font-bold' : 'text-stone-700'}`}
                  >
                    {prettifyModelName(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#FDFBF8]">
          {messages.length === 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#C9A66B] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed text-stone-800 max-w-[85%]">
                  Hi! I'm your AI Stylist. Tell me the occasion, your budget, or the kind of piece you have in mind — I'll recommend matching products from our catalogue.
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-9">
                {SUGGESTED_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="text-[11px] border border-[#C9A66B]/40 text-[#A67C52] hover:bg-[#C9A66B]/10 rounded-full px-3 py-1"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#C9A66B] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed rounded-2xl tab-fade-in ${
                  m.role === 'user'
                    ? 'bg-[#1D1D1D] text-[#FDFBF8] rounded-tr-sm'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.productRefs && m.productRefs.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {m.productRefs.map(sku => {
                      const p = productBySku.get(sku);
                      if (!p) return null;
                      return (
                        <a
                          key={sku}
                          href={`#prod-card-${p.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent('gg:openProduct', { detail: p.id }));
                          }}
                          className="block bg-stone-50 hover:bg-stone-100 rounded p-1.5 border border-stone-200 text-left transition-colors"
                        >
                          <img
                            src={p.images[0] || ''}
                            alt={p.name}
                            className="w-full aspect-square object-cover rounded mb-1"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                          <p className="text-[10px] font-bold truncate text-stone-900">{p.name}</p>
                          <p className="text-[10px] text-[#C9A66B] font-bold">₹{p.discountPrice.toLocaleString('en-IN')}</p>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-[#C9A66B] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-3 py-2 text-xs">
                <div className="dot-blink"><span /><span /><span /></div>
              </div>
            </div>
          )}

          {messages.length > 1 && !sending && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_FOLLOWUPS.map(p => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="text-[10px] border border-stone-300 text-stone-600 hover:bg-stone-100 rounded-full px-2.5 py-1 flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3" /> {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-stone-200 bg-white flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask anything — 'show me bridal sets under ₹5,000'..."
            className="flex-1 resize-none border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A66B] max-h-24"
          />
          <button
            onClick={() => handleSend()}
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="p-2.5 bg-[#1D1D1D] text-white rounded-xl hover:bg-[#C9A66B] disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-1.5 bg-stone-50 border-t border-stone-200 text-center">
          <a
            href="#footer"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}
            className="text-[10px] text-stone-500 hover:text-[#C9A66B] inline-flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" /> Prefer a human? WhatsApp the founders directly
          </a>
        </div>
      </div>
    </>
  );
}