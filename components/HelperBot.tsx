'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Headphones,
  Sparkles,
  Send,
  X,
  MessageSquare,
  Phone,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  PackageCheck,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { sanitizeText } from '@/lib/security';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const FAQ_SUGGESTIONS = [
  { label: '📦 Open-Parcel COD', prompt: 'How does Open-Parcel Delivery (Check Karo, Pay Karo) work?' },
  { label: '🛡️ Verify PTA DIRBS', prompt: 'How do I verify 100% PTA Approval for my phone?' },
  { label: '💳 0% EMI Banks', prompt: 'Which Pakistani banks offer 0% markup installments?' },
  { label: '⚡ Mobiles Under 50k', prompt: 'What are the best budget smartphones under 50,000 PKR?' },
  { label: '🔥 S24 & iPhone Deals', prompt: 'Show me the latest flagship deals on Samsung Galaxy and Apple iPhone.' },
  { label: '💬 WhatsApp Support', prompt: 'How can I connect directly with a live representative on WhatsApp?' },
];

// Helper to format basic markdown (bold, bullets, headings, links)
function FormattedBotMessage({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading 3 or 2
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-slate-950 text-xs sm:text-sm mt-2 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#48afff] inline-block"></span>
              {trimmed.replace(/^###\s*/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-black text-[#0b3c68] text-sm sm:text-base mt-2.5 mb-1">
              {trimmed.replace(/^##\s*/, '')}
            </h3>
          );
        }

        // Bullet point
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed);
        const content = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');

        // Render inline formatting (bold, links, code)
        const renderInline = (str: string) => {
          const linkRegex = /\[(.*?)\]\(([^\s)]+)\)/g;
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let match;

          while ((match = linkRegex.exec(str)) !== null) {
            if (match.index > lastIndex) {
              parts.push(str.substring(lastIndex, match.index));
            }
            const label = match[1];
            const href = match[2];
            const isExternal = href.startsWith('http://') || href.startsWith('https://');

            parts.push(
              isExternal ? (
                <a
                  key={match.index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#136ab5] hover:text-[#0b3c68] font-bold underline underline-offset-2 inline-flex items-center gap-0.5 mx-0.5"
                >
                  {label.replace(/\*\*/g, '')}
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              ) : (
                <Link
                  key={match.index}
                  href={href}
                  className="text-[#136ab5] hover:text-[#0b3c68] font-bold underline underline-offset-2 inline-flex items-center gap-0.5 mx-0.5"
                >
                  {label.replace(/\*\*/g, '')}
                </Link>
              )
            );
            lastIndex = linkRegex.lastIndex;
          }
          if (lastIndex < str.length) {
            parts.push(str.substring(lastIndex));
          }

          return parts.map((part, pIdx) => {
            if (typeof part !== 'string') return part;
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            return boldParts.map((bp, bIdx) => {
              if (bp.startsWith('**') && bp.endsWith('**')) {
                return (
                  <strong key={`${pIdx}-${bIdx}`} className="font-bold text-slate-950">
                    {bp.slice(2, -2)}
                  </strong>
                );
              }
              if (bp.startsWith('`') && bp.endsWith('`') && bp.length > 2) {
                return (
                  <code key={`${pIdx}-${bIdx}`} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-[#0b3c68] border border-slate-200">
                    {bp.slice(1, -1)}
                  </code>
                );
              }
              return bp;
            });
          });
        };

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#48afff] font-bold text-xs mt-0.5">•</span>
              <span className="flex-1">{renderInline(content)}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

export function HelperBot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `👋 **Hello! Welcome to Nawira Traders.**

I'm your **Personal Mobile Advisor**. Whether you're comparing smartphones, verifying PTA approval, checking 0% EMI bank installments, or inquiring about Open-Parcel delivery, I'm here to assist you.

**Key Customer Guarantees:**
• 📦 **Open-Parcel Delivery**: Inspect and verify your parcel before paying
• 🛡️ **100% PTA Approved**: Official DIRBS-registered authentic smartphones
• 💳 **0% Markup EMI**: Up to 12 months installment plans on credit cards
• ⚡ **Official Brand Warranty**: 1-year brand warranty on all devices

Tap any question below or type your question to get instant guidance!`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    const sanitized = sanitizeText(query, 500);

    if (!sanitized.trim() || isLoading) return;

    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: sanitized,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const historyPayload = messages.slice(-5).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitized,
          history: historyPayload,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const botReply =
        data?.reply ||
        "I'm here to assist you! You can ask about smartphone specifications, live market prices, PTA approval, or connect with our customer team directly on WhatsApp at +92 313 5221200.";

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (!isAbort) {
        const errorMsg: ChatMessage = {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `⚠️ I'm here to assist you! If you need instant live help, you can also reach our mobile advisors on WhatsApp at [+92 313 5221200](https://wa.me/923135221200).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setInputMessage('');
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: `👋 Chat reset! How can I assist you today with Nawira Traders smartphones or orders?`,
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Launcher Button */}
      {!isOpen && (
        <aside
          aria-label="Nawira Traders Live Support"
          className="fixed bottom-[128px] sm:bottom-[88px] right-4 sm:right-6 z-40 flex items-center"
        >
          <button
            onClick={() => {
              setIsOpen(true);
              setHasUnread(false);
            }}
            aria-label="Ask Nawira Traders Support"
            title="Chat with Nawira Traders Specialist"
            className="group relative flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-[#0b3c68] hover:bg-[#082e50] text-white shadow-xl shadow-[#0b3c68]/30 hover:shadow-[#0b3c68]/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/60 cursor-pointer"
          >
            {/* Online Pulse Indicator */}
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white" />
            </span>

            <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform group-hover:scale-110" />
            <span className="text-xs font-black tracking-wide hidden sm:inline">Ask Specialist</span>
          </button>
        </aside>
      )}

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <section
          aria-label="Nawira Traders Customer Support"
          className="fixed bottom-0 sm:bottom-6 left-0 right-0 sm:left-auto sm:right-6 z-50 w-full sm:w-[420px] h-[88vh] sm:h-[600px] max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl bg-white border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        >
          {/* Header matching Nawira Traders Blue Theme */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#0b3c68] via-[#0f497a] to-[#136ab5] text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white text-[#0b3c68] flex items-center justify-center shadow-md border border-white/30">
                  <Headphones className="w-5 h-5 text-[#0b3c68]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0b3c68] rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1">
                    Nawira Traders Assistant
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </h3>
                  <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-full bg-[#f88b2a] text-white shadow-xs">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-sky-100 font-medium">
                  Official Smartphone &amp; Order Advisor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                aria-label="Reset conversation"
                className="p-1.5 rounded-xl text-sky-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
                title="Restart Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat window"
                className="p-1.5 rounded-xl text-sky-100 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Helpline Ribbon */}
          <div className="px-4 py-2 bg-sky-50 border-b border-sky-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-700 font-semibold flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-[#136ab5]" />
              Direct Helpline: <strong className="font-bold text-[#0b3c68]">+92 313 5221200</strong>
            </span>
            <a
              href="https://wa.me/923135221200?text=Hi%20Nawira%20Traders!%20I%20have%20an%20inquiry%20regarding%20mobile%20phones."
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 bg-emerald-100/60 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              WhatsApp
            </a>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#f8fafc]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-[#0b3c68] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Headphones className="w-3.5 h-3.5 text-[#0b3c68]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#0b3c68] text-white rounded-tr-xs font-medium shadow-md shadow-[#0b3c68]/15'
                      : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/90 shadow-sm'
                  }`}
                >
                  {msg.sender === 'bot' ? (
                    <FormattedBotMessage text={msg.text} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <span
                    className={`block text-[10px] mt-1.5 font-medium ${
                      msg.sender === 'user' ? 'text-sky-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-[#0b3c68] flex items-center justify-center shrink-0 shadow-xs">
                  <Headphones className="w-3.5 h-3.5 text-[#0b3c68]" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-2.5 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#48afff] animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-[#48afff] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#48afff] animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-slate-500 ml-1.5 font-semibold">
                    Advisor is typing...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Chips */}
          <div className="px-3.5 py-2.5 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {FAQ_SUGGESTIONS.map((faq, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(faq.prompt)}
                disabled={isLoading}
                className="shrink-0 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#0b3c68] text-[11px] font-bold transition-all border border-slate-200 hover:border-[#48afff] cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                {faq.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask about phones, PTA, EMI, Open-Parcel..."
              className="flex-1 px-4 py-2.5 text-base sm:text-xs bg-slate-50 focus:bg-white text-slate-900 rounded-full border border-slate-200 focus:border-[#48afff] focus:outline-none focus:ring-2 focus:ring-[#48afff]/20 transition-all placeholder:text-slate-400 font-medium"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Send message"
              className="w-10 h-10 rounded-full bg-[#0b3c68] hover:bg-[#082e50] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md shadow-[#0b3c68]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-slate-50 text-center text-[10px] text-slate-500 border-t border-slate-100 font-medium">
            Nawira Traders • 100% PTA Approved &amp; Open-Parcel Delivery
          </div>
        </section>
      )}
    </>
  );
}
