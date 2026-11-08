import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, m } from "framer-motion";
import { MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";

import { assistantApi } from "../../api/assistantApi";
import ChatMessage from "./ChatMessage";

const STORAGE_KEY = "sage_assistant_chat";
const MAX_STORED = 30; // messages kept for this browser session
const MAX_SENT = 10; // messages sent to the server with each question

// Pages where the floating assistant would get in the way
const HIDDEN_ON = [
  "/dashboard",
  "/login",
  "/create-account",
  "/forgot-password",
  "/reset-password",
  "/checkout",
  "/payment",
];

const GREETING =
  "Hi, I’m Bright, the SAGE Assistant. I can answer questions about SAGE and help you choose a course or plan your next career step. What would you like to know?";

const SUGGESTIONS = [
  "Help me choose a course",
  "I want to grow my career",
  "How do payments work?",
  "Do I get a certificate?",
];

const readStored = () => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

let nextId = 0;
const makeId = () => `m${Date.now()}-${nextId++}`;

export default function ChatWidget() {
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(readStored);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const endRef = useRef(null);
  const requestRef = useRef(0); // lets "New chat" ignore a reply still in flight

  // Keep the conversation for this browser session
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED)),
      );
    } catch {
      /* storage can be unavailable (private mode): ignore */
    }
  }, [messages]);

  // Scroll to the newest message
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading, open]);

  // Focus the box when opening; Escape closes
  useEffect(() => {
    if (!open) return undefined;

    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const send = useCallback(
    async (rawText) => {
      const text = rawText.trim();
      if (!text || loading) return;

      const userMessage = { id: makeId(), role: "user", content: text };
      const conversation = [...messages, userMessage];

      setMessages(conversation);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      setLoading(true);

      const requestId = ++requestRef.current;

      try {
        // Only real turns go to the server (not error bubbles)
        const history = conversation
          .filter((message) => !message.error)
          .slice(-MAX_SENT)
          .map(({ role, content }) => ({ role, content }));

        const { data } = await assistantApi.chat(history);
        if (requestId !== requestRef.current) return;

        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: "assistant", content: data.reply },
        ]);
      } catch (err) {
        if (requestId !== requestRef.current) return;

        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            error: true,
            content:
              err.response?.data?.message ||
              "I couldn’t reach the assistant. Please check your connection and try again.",
          },
        ]);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [messages, loading],
  );

  const newChat = () => {
    requestRef.current += 1; // ignore any reply still on its way
    setMessages([]);
    setLoading(false);
    setInput("");
    inputRef.current?.focus();
  };

  // On phones the chat covers the page, so close it after following a link
  const handleNavigate = () => {
    if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
  };

  if (HIDDEN_ON.some((prefix) => pathname.startsWith(prefix))) return null;

  // The course page has a fixed "Buy now" bar on phones: sit above it
  const aboveMobileBar = /^\/courses\/[^/]+$/.test(pathname);
  const launcherPosition = aboveMobileBar
    ? "bottom-24 sm:bottom-6"
    : "bottom-5 sm:bottom-6";

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the SAGE Assistant"
          className={`fixed right-4 z-50 inline-flex h-14 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-white shadow-xl shadow-red-900/20 transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:right-6 ${launcherPosition}`}
        >
          <MessageCircle size={22} />
          <span className="hidden sm:inline">Ask SAGE</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <m.div
            key="assistant-panel"
            role="dialog"
            aria-label="SAGE Assistant"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100vh-3rem))] sm:w-[390px] sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-secondary px-4 py-3 text-white">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Sparkles size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">SAGE Assistant</p>
                <p className="truncate text-xs text-blue-100">
                  Course and career advice
                </p>
              </div>

              <button
                type="button"
                onClick={newChat}
                aria-label="Start a new chat"
                title="New chat"
                className="cursor-pointer rounded-lg p-2 text-blue-100 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw size={17} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the assistant"
                className="cursor-pointer rounded-lg p-2 text-blue-100 transition hover:bg-white/10 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            {/* Conversation */}
            <div
              className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4"
              aria-live="polite"
            >
              <ChatMessage
                message={{ role: "assistant", content: GREETING }}
                onNavigate={handleNavigate}
              />

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="cursor-pointer rounded-full border border-primary/25 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onNavigate={handleNavigate}
                />
              ))}

              {loading && (
                <div
                  className="mr-auto inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3"
                  role="status"
                  aria-label="The assistant is typing"
                >
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400 motion-reduce:animate-none"
                      style={{ animationDelay: `${dot * 0.15}s` }}
                    />
                  ))}
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
              className="border-t border-gray-200 bg-white p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  maxLength={500}
                  disabled={loading}
                  placeholder="Ask about courses or careers…"
                  aria-label="Your message"
                  onChange={(event) => {
                    setInput(event.target.value);
                    event.target.style.height = "auto";
                    event.target.style.height = `${Math.min(event.target.scrollHeight, 112)}px`;
                  }}
                  onKeyDown={(event) => {
                    // Enter sends, Shift+Enter adds a new line
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send(input);
                    }
                  }}
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:bg-gray-50 sm:text-sm"
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>

              <p className="mt-2 text-center text-[11px] leading-4 text-gray-400">
                AI assistant. It can make mistakes. For account or payment
                issues, use Contact us.
              </p>
            </form>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
