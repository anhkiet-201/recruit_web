"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, User, Bot, RefreshCw, ArrowRight, Plus, Briefcase, FileText, DollarSign, Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import MarkdownRenderer from "./ui/MarkdownRenderer";
import { useTranslations, useLocale } from "next-intl";

/**
 * Interface cho Tin nhắn
 */
interface Message {
    role: "user" | "bot";
    text: string;
    searchQuery?: string;
    isSuggest?: boolean;
    timestamp: number;
}

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 Giờ
const MAX_HISTORY_CONTEXT = 15; // Chỉ gửi 15 tin gần nhất để tối ưu Token

export default function AiChatBot() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const t = useTranslations("Chatbot");
    const locale = useLocale();

    const INITIAL_MESSAGES: Message[] = [
        { role: "bot", text: t('greeting'), timestamp: Date.now() }
    ];

    const SUGGESTIONS = [
        { icon: Briefcase, text: t('suggestions.findJob'), query: t('suggestions.findJob') },
        { icon: FileText, text: t('suggestions.cvTips'), query: t('suggestions.cvTips') },
        { icon: DollarSign, text: t('suggestions.salary'), query: t('suggestions.salary') },
        { icon: Lightbulb, text: t('suggestions.interview'), query: t('suggestions.interview') },
    ];

    // --- STATE ---
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);

    // Initial load handling to respect translation hook
    useEffect(() => {
        // Only load initial if no session, but we need to wait for 't' to be ready essentially (it is synchronous though)
        // If we load from session, we might have old messages in different language? 
        // ideally, chat history persists language, OR we clear it on language change. 
        // For now, let's just respect the session if it exists, otherwise use translated initial.
        const savedSession = localStorage.getItem("chat_session");
        if (savedSession) {
            try {
                const { messages: savedMessages, lastActive } = JSON.parse(savedSession);
                if (Date.now() - lastActive < SESSION_TIMEOUT) {
                    setMessages(savedMessages);
                } else {
                    localStorage.removeItem("chat_session");
                    setMessages(INITIAL_MESSAGES);
                }
            } catch (e) {
                localStorage.removeItem("chat_session");
                setMessages(INITIAL_MESSAGES);
            }
        } else {
            setMessages(INITIAL_MESSAGES);
        }
    }, []); // Run once on mount

    // --- EFFECT: Click Outside to Close ---
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        if (messages.length > 1) {
            localStorage.setItem("chat_session", JSON.stringify({ messages, lastActive: Date.now() }));
        }
    }, [messages]);

    // --- EFFECT: Auto Scroll ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, loading]);

    // --- LOGIC HELPERS ---

    const processBotResponse = (rawText: string) => {
        let text = rawText || "";
        let searchQuery = "";
        let isSuggest = false;

        const searchMatch = text.match(/\[(SEARCH|SUGGEST):\s*(.*?)\]/i);
        if (searchMatch) {
            const type = searchMatch[1].toUpperCase();
            searchQuery = searchMatch[2];
            isSuggest = type === 'SUGGEST';
        }

        // Xóa sạch các thẻ trong ngoặc vuông
        text = text.replace(/\[.*?\]/g, "").trim();

        if (!text && searchQuery) {
            text = isSuggest ? t('thinking') : t('thinking');
        }

        return { text, searchQuery, isSuggest };
    };

    const triggerSearch = (query: string, isSuggest: boolean) => {
        if (isSuggest && pathname === '/jobs') {
            const params = new URLSearchParams(searchParams.toString());
            params.set("ai_q", query);
            router.push(`/jobs?${params.toString()}`);
        } else {
            router.push(`/jobs?ai_q=${encodeURIComponent(query)}`);
            if (window.innerWidth < 640) setIsOpen(false); // Đóng chat trên mobile sau khi tìm
        }
    };

    const handleNewChat = () => {
        setMessages(INITIAL_MESSAGES);
        localStorage.removeItem("chat_session");
        setInput("");
    };

    const handleSuggestionClick = (query: string) => {
        sendMessage(query);
    };

    // --- CORE SEND LOGIC ---
    const sendMessage = async (content: string) => {
        if (!content.trim() || loading) return;

        const userMsg: Message = { role: "user", text: content, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // Context Pruning: Chỉ lấy N tin nhắn gần nhất
            const historyContext = messages.slice(-MAX_HISTORY_CONTEXT).map(msg => ({
                role: msg.role === 'bot' ? 'assistant' : 'user',
                parts: msg.text
            }));

            const contextMessage = `[User Context: Page=${pathname}, Language=${locale}] ${content}`;

            const result = await api.post<{ response: string }>("/ai/chat", {
                message: contextMessage,
                history: historyContext
            });

            const { text, searchQuery, isSuggest } = processBotResponse(result.response);

            const botMsg: Message = {
                role: "bot",
                text: text,
                searchQuery,
                isSuggest,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, botMsg]);

            if (searchQuery) {
                triggerSearch(searchQuery, isSuggest);
                handleSearchFollowUp(searchQuery, historyContext);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "bot", text: t('error'), timestamp: Date.now() }]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Vòng lặp phản hồi (Feedback Loop).
     * Gửi yêu cầu ngầm để AI tự tra cứu Database và tóm tắt.
     */
    const handleSearchFollowUp = async (query: string, currentHistory: any[]) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const systemMsg = `[SYSTEM_EVENT: Search for "${query}" completed.]`;

            const result = await api.post<{ response: string }>("/ai/chat", {
                message: systemMsg,
                history: currentHistory
            });

            const { text } = processBotResponse(result.response);

            if (text) {
                setMessages(prev => {
                    const updated = prev.map(msg =>
                        msg.searchQuery === query ? { ...msg, searchQuery: undefined } : msg
                    );
                    return [...updated, { role: "bot", text: text, timestamp: Date.now() }];
                });
            }
        } catch (e) {
            console.error("Follow-up search error:", e);
            setMessages(prev => prev.map(msg => ({ ...msg, searchQuery: undefined })));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    // --- RENDER ---
    if (pathname?.includes('/admin')) return null;

    return (
        <>
            {/* 1. Trigger Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-[999]"
                    >
                        <div className="absolute inset-0 bg-blue-500/50 rounded-full blur-xl animate-pulse -z-10"></div>
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/20"
                        >
                            <MessageSquare size={28} />
                            {/* Notification Dot */}
                            <span className="absolute top-0 right-0 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                            </span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. Chat Window (Modal) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={chatWindowRef}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed z-[9999] flex flex-col overflow-hidden shadow-2xl bg-white/10 backdrop-blur-3xl border border-white/20
                            /* Mobile: Full Screen */
                            inset-0 w-full h-full rounded-none
                            /* Desktop: Fixed Widget */
                            sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[450px] sm:h-[650px] sm:rounded-3xl"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-center sm:justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">{t('title')}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{t('status')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={handleNewChat} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title={t('clearHistory')}>
                                    <RefreshCw size={18} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Close">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-gradient-to-b from-white/50 to-blue-50/30">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={`${idx}-${msg.timestamp}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-indigo-600'}`}>
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                                        </div>

                                        {/* Bubble */}
                                        <div className={`flex flex-col gap-2`}>
                                            <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                                                : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm"
                                                }`}>
                                                <MarkdownRenderer content={msg.text} />
                                            </div>

                                            {/* Search Status Indicator */}
                                            {msg.searchQuery && (
                                                <div className="flex items-center gap-2 text-xs text-blue-600 font-medium ml-1 animate-pulse">
                                                    <RefreshCw size={10} className="animate-spin" />
                                                    {msg.isSuggest ? t('thinking') : t('thinking')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading / Typing Indicator */}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-indigo-600"><Bot size={16} /></div>
                                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Footer: Quick Actions & Input */}
                        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex-shrink-0">

                            {/* Quick Suggestions (Only if messages < 5 to keep clean) */}
                            {messages.length < 5 && !loading && (
                                <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mask-fade-right">
                                    {SUGGESTIONS.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestionClick(suggestion.query)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
                                        >
                                            <suggestion.icon size={12} />
                                            {suggestion.text}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('inputPlaceholder')}
                                    className="flex-1 bg-gray-100/50 hover:bg-gray-100 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="p-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400">{t('disclaimer')}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
