'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Send,
  Phone,
  Mail,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import { getClient, getMessages, addMessage, updateClient } from '@/lib/storage';
import { Client, Message } from '@/lib/types';
import { cn, formatCurrency, formatDate, generateId } from '@/lib/utils';
import { STATUS_COLORS, PRACTICE_AREAS } from '@/lib/constants';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const c = getClient(id);
    if (c) {
      setClient(c);
      setMessages(getMessages(id));
      // Mark as read when opening the chat
      updateClient(id, { lastReadAt: new Date().toISOString() });
      // Load suggestions
      loadSuggestions(c, getMessages(id));
    }
  }, [id]);

  const loadSuggestions = (client: Client, msgs: Message[]) => {
    if (msgs.length === 0) {
      setSuggestions([
        "Hi! I wanted to follow up on our lead generation discussion.",
        "Do you have time for a quick call this week?",
        "I'd love to learn more about your practice area needs."
      ]);
      return;
    }
    
    const lastMsg = msgs[msgs.length - 1];
    const lastClientMsg = lastMsg.role === 'client' ? lastMsg.content.toLowerCase() : '';
    
    // Context-aware suggestions based on conversation
    let contextSuggestions: string[] = [];
    
    if (lastClientMsg.includes('price') || lastClientMsg.includes('cost') || lastClientMsg.includes('budget')) {
      contextSuggestions = [
        `Our ${client.order.practiceArea} leads typically range from $50-150 per lead depending on volume.`,
        "I can offer a discount if you commit to a higher monthly volume.",
        "Let me put together a custom pricing proposal for you."
      ];
    } else if (lastClientMsg.includes('quality') || lastClientMsg.includes('exclusive')) {
      contextSuggestions = [
        "All our leads are exclusive and pre-qualified for your practice area.",
        "We guarantee a minimum contact rate and offer replacements for bad leads.",
        "I can share some case studies from similar firms in your area."
      ];
    } else if (lastClientMsg.includes('think') || lastClientMsg.includes('consider') || lastClientMsg.includes('review')) {
      contextSuggestions = [
        "Take your time. I'm here when you're ready to discuss further.",
        "Would it help if I sent over some additional information?",
        "No pressure at all. Feel free to reach out with any questions."
      ];
    } else if (lastClientMsg.includes('call') || lastClientMsg.includes('meeting') || lastClientMsg.includes('schedule')) {
      contextSuggestions = [
        "I'm available Tuesday or Thursday afternoon. What works for you?",
        "How about a quick 15-minute call tomorrow?",
        "I'll send you a calendar invite. Looking forward to it!"
      ];
    } else if (lastClientMsg.includes('interested') || lastClientMsg.includes('sounds good')) {
      contextSuggestions = [
        "Great! Let me draft up a proposal with pricing and terms.",
        "Perfect. What monthly volume are you thinking?",
        "Excellent. Should we start with a trial period?"
      ];
    } else if (lastClientMsg.includes('not sure') || lastClientMsg.includes('maybe') || lastClientMsg.includes('hesitant')) {
      contextSuggestions = [
        "I understand. What concerns do you have that I can address?",
        "No worries. Would you like to start with a smaller test campaign?",
        "That's fair. What would make this a no-brainer for you?"
      ];
    } else {
      // Default suggestions based on order status
      if (client.order.leadsPerMonth) {
        contextSuggestions = [
          "How are the leads performing so far?",
          "Should we adjust the volume or targeting?",
          "I have some optimization ideas to improve your ROI."
        ];
      } else {
        contextSuggestions = [
          "Thanks for getting back to me. What questions can I answer?",
          "I'd love to understand your lead generation goals better.",
          "What volume of leads are you looking for each month?"
        ];
      }
    }
    
    setSuggestions(contextSuggestions);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !client) return;

    const userMsg: Message = {
      id: generateId(),
      clientId: id,
      content: input.trim(),
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    addMessage(userMsg);
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      // Call API immediately
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          message: userMsg.content,
          history: [...messages, userMsg].slice(-20),
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      
      // Wait 15 seconds before showing typing indicator
      await new Promise((r) => setTimeout(r, 15000));
      setTyping(true);
      
      // Wait 20 seconds before sending the message
      await new Promise((r) => setTimeout(r, 20000));
      
      const clientMsg: Message = {
        id: generateId(),
        clientId: id,
        content: data.response,
        role: 'client',
        timestamp: new Date().toISOString(),
      };

      setTyping(false);
      addMessage(clientMsg);
      setMessages((prev) => [...prev, clientMsg]);
      // Reload suggestions after new message
      if (client) loadSuggestions(client, [...messages, userMsg, clientMsg]);
    } catch {
      setTyping(false);
      const errorMsg: Message = {
        id: generateId(),
        clientId: id,
        content: '[AI response unavailable — check your API key in .env.local]',
        role: 'client',
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMsg);
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (!client) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-dark">
        Client not found.
        <Link href="/" className="ml-2 text-gold">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Navigation Bar */}
      <header className="glass relative z-10 border-b border-separator">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Link
            href="/"
            className="flex items-center justify-center -ml-1 shrink-0"
          >
            <ChevronLeft className="h-[28px] w-[28px]" strokeWidth={2.5} />
          </Link>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-[15px] font-semibold leading-tight truncate">
              {client.contactName}
            </h1>
            <p className="text-[13px] text-muted-dark mt-0.5 truncate">
              {client.firmName}
            </p>
          </div>
          <button
            onClick={() => setShowOrder(true)}
            className="flex h-8 w-8 items-center justify-center shrink-0 text-accent transition-transform duration-150 active:scale-90"
          >
            <Info className="h-[20px] w-[20px]" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-4">

          {/* Message bubbles */}
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const prevMsg = messages[i - 1];
            const nextMsg = messages[i + 1];
            const sameSender = prevMsg?.role === msg.role;
            const isLastUserMessage = isUser && nextMsg?.role !== 'user';
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex animate-slide-up',
                  isUser ? 'justify-end' : 'justify-start',
                  sameSender ? 'mt-[3px]' : 'mt-4'
                )}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      'px-3.5 py-2 text-[15px] leading-[1.35]',
                      isUser
                        ? 'bg-accent text-white rounded-[20px] rounded-br-[6px] max-w-[260px]'
                        : 'bg-surface-light text-foreground rounded-[20px] rounded-bl-[6px] max-w-[260px]'
                    )}
                  >
                    <p>{msg.content}</p>
                  </div>
                  {isUser && isLastUserMessage && (
                    <p className="text-[11px] text-muted-dark mt-1">
                      Delivered
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator — iMessage dots */}
          {typing && (
            <div className="mt-4 flex justify-start animate-scale-in">
              <div className="flex items-center gap-[5px] rounded-[20px] rounded-bl-[6px] bg-surface-light px-4 py-3">
                <span className="h-[7px] w-[7px] animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                <span className="h-[7px] w-[7px] animate-bounce rounded-full bg-muted [animation-delay:160ms]" />
                <span className="h-[7px] w-[7px] animate-bounce rounded-full bg-muted [animation-delay:320ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="glass border-t border-separator px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-end gap-2 pt-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="iMessage"
            disabled={sending}
            className="flex-1 rounded-full border border-border bg-transparent px-4 py-2 text-[15px] text-foreground placeholder:text-muted-dark focus:outline-none focus:border-muted disabled:opacity-40 transition-colors duration-150"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200',
              input.trim() && !sending
                ? 'bg-accent text-white scale-100'
                : 'bg-surface-solid text-muted-dark scale-90 opacity-60'
            )}
          >
            {sending ? (
              <Loader2 className="h-[16px] w-[16px] animate-spin" />
            ) : (
              <Send className="h-[16px] w-[16px]" />
            )}
          </button>
        </form>
      </div>

      {/* Order Panel — Apple sheet style */}
      {showOrder && (
        <OrderPanel
          client={client}
          onClose={() => setShowOrder(false)}
          onSave={(updated) => {
            setClient(updated);
            setShowOrder(false);
          }}
        />
      )}
    </div>
  );
}

function OrderPanel({
  client,
  onClose,
  onSave,
}: {
  client: Client;
  onClose: () => void;
  onSave: (c: Client) => void;
}) {
  const [order, setOrder] = useState(client.order);
  const [status, setStatus] = useState(client.status);

  const save = () => {
    const updated = updateClient(client.id, { order, status });
    if (updated) onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[85dvh] animate-slide-up overflow-y-auto rounded-t-2xl bg-surface-solid pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex justify-center bg-surface-solid pt-3 pb-2">
          <div className="h-[5px] w-9 rounded-full bg-surface-elevated" />
        </div>

        <div className="px-5 pb-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[20px] font-bold">Order Details</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-muted transition-transform active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5">
            <Field label="PRACTICE AREA">
              <select
                value={order.practiceArea}
                onChange={(e) =>
                  setOrder({ ...order, practiceArea: e.target.value })
                }
                className="w-full rounded-xl bg-surface-light px-4 py-3 text-[15px] text-foreground focus:outline-none"
              >
                {PRACTICE_AREAS.map((pa) => (
                  <option key={pa} value={pa}>
                    {pa}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="STATUS">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Client['status'])}
                className="w-full rounded-xl bg-surface-light px-4 py-3 text-[15px] text-foreground focus:outline-none"
              >
                {['Active', 'Paused', 'Negotiating', 'New Lead'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            {/* Grouped fields — Apple Settings style */}
            <div className="overflow-hidden rounded-xl bg-surface-light">
              <div className="flex items-center justify-between border-b border-separator px-4 py-3">
                <span className="text-[15px] text-muted">Leads / Month</span>
                <input
                  type="number"
                  value={order.leadsPerMonth ?? ''}
                  onChange={(e) =>
                    setOrder({
                      ...order,
                      leadsPerMonth: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 bg-transparent text-right text-[15px] text-foreground focus:outline-none"
                  placeholder="—"
                />
              </div>
              <div className="flex items-center justify-between border-b border-separator px-4 py-3">
                <span className="text-[15px] text-muted">Cost Per Lead</span>
                <div className="flex items-center gap-1">
                  <span className="text-[15px] text-muted-dark">$</span>
                  <input
                    type="number"
                    value={order.costPerLead ?? ''}
                    onChange={(e) =>
                      setOrder({
                        ...order,
                        costPerLead: e.target.value
                          ? Number(e.target.value)
                          : null,
                        monthlyBudget:
                          e.target.value && order.leadsPerMonth
                            ? Number(e.target.value) * order.leadsPerMonth
                            : null,
                      })
                    }
                    className="w-20 bg-transparent text-right text-[15px] text-foreground focus:outline-none"
                    placeholder="—"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[15px] text-muted">Monthly Budget</span>
                <span className="text-[15px] font-medium text-accent">
                  {order.monthlyBudget
                    ? formatCurrency(order.monthlyBudget)
                    : 'TBD'}
                </span>
              </div>
            </div>

            <Field label="NOTES">
              <textarea
                value={order.notes}
                onChange={(e) => setOrder({ ...order, notes: e.target.value })}
                rows={3}
                className="w-full rounded-xl bg-surface-light px-4 py-3 text-[15px] text-foreground focus:outline-none resize-none"
              />
            </Field>

            <button
              onClick={save}
              className="w-full rounded-xl bg-accent py-3.5 text-[15px] font-semibold text-white transition-all duration-150 active:scale-[0.98] hover:bg-accent-light"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-dark uppercase pl-1">
        {label}
      </label>
      {children}
    </div>
  );
}
