"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, User, Bot, RefreshCw, Minus, Search, Wand2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import MarkdownRenderer from "./ui/MarkdownRenderer";

interface Message {
    role: "user" | "bot";
    text: string;
    searchQuery?: string;
    isAutoRedirecting?: boolean;
}

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 Hour

export default function AiChatBot() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", text: "Xin chào! Tôi là trợ lý AI của RecruitWeb. Tôi có thể giúp gì cho bạn hôm nay?" }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ... (keep useEffect for session and scroll)
    useEffect(() => {
        const savedSession = localStorage.getItem("chat_session");
        if (savedSession) {
            try {
                const { messages: savedMessages, lastActive } = JSON.parse(savedSession);
                if (Date.now() - lastActive < SESSION_TIMEOUT) setMessages(savedMessages);
                else localStorage.removeItem("chat_session");
            } catch (e) { localStorage.removeItem("chat_session"); }
        }
    }, []);

    useEffect(() => {
        if (messages.length > 1) {
            localStorage.setItem("chat_session", JSON.stringify({ messages, lastActive: Date.now() }));
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const triggerSearch = (query: string) => {
        router.push(`/jobs?ai_q=${encodeURIComponent(query)}`);
        setIsOpen(false);
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: userMessage }]);
        setLoading(true);

        try {
            const history = messages.slice(1).map(msg => ({ role: msg.role === 'bot' ? 'model' : 'user', parts: msg.text }));
            const result = await api.post("/ai/chat", { message: userMessage, history: history });
            let botText = result.response;
            let searchQuery = "";
            const searchMatch = botText.match(/\[SEARCH:\s*(.*?)\]/);
            
            if (searchMatch) {
                searchQuery = searchMatch[1];
                botText = botText.replace(searchMatch[0], "").trim();
            }

            setMessages(prev => [...prev, { role: "bot", text: botText, searchQuery, isAutoRedirecting: !!searchQuery }]);

            if (searchQuery) {
                setTimeout(() => triggerSearch(searchQuery), 2500);
            }
        } catch (error) {
            console.error("Chat failed", error);
            setMessages(prev => [...prev, { role: "bot", text: "Xin lỗi, tôi gặp chút trục trặc kỹ thuật." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button 
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 rounded-[1.8rem] shadow-2xl shadow-blue-500/40 flex items-center justify-center text-white z-[999] group"
                    >
                        <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 100 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-8 right-8 w-[380px] sm:w-[420px] h-[600px] bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/50 flex flex-col overflow-hidden z-[999]"
                    >
                        {/* Header */}
                        <div className="p-6 flex items-center justify-between flex-shrink-0 bg-white/20 border-b border-white/30 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 ring-2 ring-white/50">
                                    <Sparkles className="text-white fill-white" size={22} />
                                </div>
                                <div>
                                    <h3 className="text-gray-900 font-black text-sm uppercase tracking-wider">RecruitWeb AI</h3>
                                    <div className="mt-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span><span className="text-[9px] font-bold text-gray-400">Assistant Online</span></div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-white/50 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-transparent">
                            {messages.map((msg, idx) => (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md border border-white/50 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-400'}`}>
                                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`p-4 font-medium leading-relaxed shadow-xl ${
                                            msg.role === 'user' 
                                                ? "bg-blue-600 text-white rounded-[1.5rem] rounded-tr-none shadow-blue-500/20" 
                                                : "bg-white/80 backdrop-blur-md text-gray-700 rounded-[1.5rem] rounded-tl-none border border-white/50 shadow-gray-200/20 text-sm"
                                        }`}>
                                            <MarkdownRenderer content={msg.text} />
                                        </div>
                                    </div>
                                    
                                    {msg.searchQuery && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 ml-12">
                                            <button onClick={() => triggerSearch(msg.searchQuery!)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all active:scale-95 border border-white/20">
                                                <Wand2 size={14} />Xem kết quả: {msg.searchQuery}
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white/80 border border-white/50 flex items-center justify-center animate-pulse"><Bot size={16} className="text-gray-300" /></div>
                                        <div className="bg-white/60 backdrop-blur-md p-4 rounded-[1.5rem] rounded-tl-none shadow-xl border border-white/50 flex gap-1.5 items-center">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white/30 backdrop-blur-md border-t border-white/30 flex-shrink-0">
                            <form onSubmit={handleSend} className="relative">
                                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi tôi bất cứ điều gì..."
                                    className="w-full bg-white/80 border border-white/50 rounded-2xl pl-5 pr-14 py-4 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all shadow-xl shadow-gray-200/20 placeholder:text-gray-300"
                                />
                                <button type="submit" disabled={!input.trim() || loading}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}