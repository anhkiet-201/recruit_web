"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, User, Bot, RefreshCw, ArrowRight, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import MarkdownRenderer from "./ui/MarkdownRenderer";

/**
 * Interface cho Tin nhắn trong Chatbox.
 */
interface Message {
    role: "user" | "bot";
    text: string;
    searchQuery?: string; // Query tìm kiếm nếu AI đang thực hiện tìm kiếm
    isSuggest?: boolean;  // True nếu là gợi ý chủ động, False nếu là tìm kiếm trực tiếp
}

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 Giờ
const INITIAL_MESSAGES: Message[] = [
    { role: "bot", text: "Xin chào! Tôi là trợ lý AI của RecruitWeb. Tôi có thể giúp gì cho bạn hôm nay?" }
];

/**
 * Component AI ChatBot nổi (Floating Action Button).
 * Hỗ trợ:
 * - Hội thoại ngữ nghĩa với AI.
 * - Tự động tìm kiếm việc làm (RAG).
 * - Lưu phiên chat local.
 */
export default function AiChatBot() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State Management
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- EFFECT: Quản lý Phiên (Session) ---
    useEffect(() => {
        const savedSession = localStorage.getItem("chat_session");
        if (savedSession) {
            try {
                const { messages: savedMessages, lastActive } = JSON.parse(savedSession);
                // Khôi phục session nếu chưa hết hạn
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

    // Auto-scroll xuống tin nhắn mới nhất
    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    /**
     * Helper: Xử lý chuỗi phản hồi từ AI.
     * Tách lệnh [SEARCH] và làm sạch nội dung hiển thị.
     */
    const processBotResponse = (rawText: string) => {
        let text = rawText || "";
        let searchQuery = "";
        let isSuggest = false;

        // 1. Trích xuất SEARCH/SUGGEST tag
        const searchMatch = text.match(/\[(SEARCH|SUGGEST):\s*(.*?)\]/i);
        if (searchMatch) {
            const type = searchMatch[1].toUpperCase();
            searchQuery = searchMatch[2];
            isSuggest = type === 'SUGGEST';
        }

        // 2. Xóa sạch các thẻ hệ thống [TAG: ...] để hiển thị đẹp
        text = text.replace(/\[.*?\]/g, "").trim();

        // 3. Fallback text nếu rỗng
        if (!text && searchQuery) {
            text = isSuggest 
                ? "Tôi đang lọc các công việc phù hợp..." 
                : "Tôi đang tìm kiếm...";
        }

        return { text, searchQuery, isSuggest };
    };

    /**
     * Logic điều hướng khi có lệnh tìm kiếm.
     */
    const triggerSearch = (query: string, isSuggest: boolean) => {
        if (isSuggest && pathname === '/jobs') {
            const params = new URLSearchParams(searchParams.toString());
            params.set("ai_q", query);
            router.push(`/jobs?${params.toString()}`);
        } else {
            router.push(`/jobs?ai_q=${encodeURIComponent(query)}`);
            setIsOpen(false);
        }
    };

    /**
     * Reset cuộc trò chuyện.
     */
    const handleNewChat = () => {
        if (window.confirm("Bạn có muốn xóa cuộc trò chuyện hiện tại và bắt đầu phiên mới không?")) {
            setMessages(INITIAL_MESSAGES);
            localStorage.removeItem("chat_session");
            setInput("");
        }
    };

    /**
     * Gửi tin nhắn và xử lý phản hồi.
     */
    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: userMessage }]);
        setLoading(true);

        try {
            // Chuẩn bị lịch sử (Map role 'bot' -> 'assistant')
            const history = messages.slice(1).map(msg => ({ 
                role: msg.role === 'bot' ? 'assistant' : 'user', 
                parts: msg.text 
            }));
            
            const contextMessage = `[User is on: ${pathname}] ${userMessage}`;

            // Gọi API
            const result = await api.post<{ response: string }>("/ai/chat", {
                message: contextMessage,
                history: history
            });

            // Xử lý kết quả bằng helper function
            const { text, searchQuery, isSuggest } = processBotResponse(result.response);
            
            const newMessage: Message = { 
                role: "bot", 
                text: text, 
                searchQuery: searchQuery, 
                isSuggest: isSuggest 
            };
            
            setMessages(prev => [...prev, newMessage]);

            // Nếu có lệnh tìm kiếm, kích hoạt luồng "Hidden Feedback Loop"
            if (searchQuery) {
                triggerSearch(searchQuery, isSuggest);
                handleSearchFollowUp(searchQuery, history);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "bot", text: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau." }]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Vòng lặp phản hồi ẩn (Hidden Feedback Loop).
     * Gửi yêu cầu ngầm để AI tóm tắt kết quả tìm kiếm thực tế từ DB.
     */
    const handleSearchFollowUp = async (query: string, currentHistory: any[]) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Delay giả lập UX

            const systemMsg = `[SYSTEM_EVENT: Search for "${query}" completed. Please summarize the top results found in database.]`;
            
            const result = await api.post<{ response: string }>("/ai/chat", {
                message: systemMsg,
                history: currentHistory
            });

            // Xử lý phản hồi (lần này từ System Event nên không có search tag nữa)
            const { text } = processBotResponse(result.response);

            if (text) {
                setMessages(prev => {
                    // 1. Xóa loading state ở tin nhắn cũ
                    const updated = prev.map(msg => 
                        msg.searchQuery === query ? { ...msg, searchQuery: undefined } : msg
                    );
                    // 2. Thêm tin nhắn tóm tắt mới
                    return [...updated, { role: "bot", text: text }];
                });
            }
        } catch (e) {
            console.error("Follow-up search error:", e);
            // Tắt loading nếu lỗi
            setMessages(prev => prev.map(msg => ({ ...msg, searchQuery: undefined })));
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[999] flex flex-col items-end">
            {!isOpen && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse -z-10"></motion.div>}

            <motion.div
                layout initial={false} transition={{ type: "spring", stiffness: 350, damping: 35 }}
                style={{ borderRadius: "3rem" }}
                className={`relative flex flex-col origin-bottom-right overflow-hidden border ${isOpen ? "w-[380px] sm:w-[420px] h-[600px] bg-white/15 backdrop-blur-[40px] border-white/30 shadow-2xl" : "w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 border-none"}`}
            >
                <AnimatePresence mode="wait">
                    {!isOpen ? (
                        <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center cursor-pointer text-white relative">
                            <MessageSquare size={28} /><div className="absolute top-4 right-4 w-3 h-3 bg-green-400 border-2 border-blue-600 rounded-full animate-pulse"></div>
                        </motion.div>
                    ) : (
                        <motion.div key="chat" initial={{ opacity: 0, filter: "blur(10px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} className="flex flex-col h-full w-full relative z-10">
                            {/* Header */}
                            <div className="p-8 pb-6 flex items-center justify-between flex-shrink-0 bg-white/5 border-b border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"><Sparkles className="text-white fill-white" size={24} /></div>
                                    <div><h3 className="text-gray-900 font-black text-sm uppercase tracking-tight">RecruitWeb AI</h3><p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>Smart Assistant</p></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={handleNewChat}
                                        title="Chat mới"
                                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                    >
                                        <Plus size={22} />
                                    </button>
                                    <button 
                                        onClick={() => setIsOpen(false)} 
                                        title="Đóng"
                                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <X size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/40 backdrop-blur-md text-gray-500 border border-white/40'}`}>
                                                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                            </div>
                                            <div className={`p-5 text-sm font-bold leading-relaxed shadow-2xl ${msg.role === 'user' ? "bg-blue-600 text-white rounded-[2rem] rounded-tr-none" : "bg-white/30 backdrop-blur-md text-gray-800 rounded-[2rem] rounded-tl-none border border-white/40"}`}>
                                                <MarkdownRenderer content={msg.text} />
                                            </div>
                                        </div>
                                        {msg.searchQuery && (
                                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mt-4 ml-12">
                                                <div className="flex items-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-2xl shadow-xl border border-white/20">
                                                    <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full animate-spin"><RefreshCw size={12} /></div>
                                                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest opacity-70">{msg.isSuggest ? "Đang lọc đề xuất" : "Đang tìm kiếm"}</span><span className="text-xs font-bold">{msg.searchQuery}</span></div>
                                                    <ArrowRight size={16} className="ml-2 animate-bounce-x" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                                {loading && <div className="flex justify-start animate-pulse"><div className="flex gap-4"><div className="w-9 h-9 rounded-2xl bg-white/30 border border-white/40 flex items-center justify-center"><Bot size={18} className="text-gray-400" /></div><div className="bg-white/20 px-6 py-5 rounded-[2rem] rounded-tl-none border border-white/40 flex gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div></div></div></div>}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-8 bg-white/5 border-t border-white/10">
                                <form onSubmit={handleSend} className="relative group">
                                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Trò chuyện với AI..." className="w-full bg-white/20 border-none rounded-3xl pl-6 pr-16 py-5 text-sm font-black text-gray-900 focus:outline-none focus:bg-white/40 focus:shadow-[0_0_40px_rgba(59,130,246,0.15)] transition-all shadow-2xl placeholder:text-gray-400" />
                                    <button type="submit" disabled={!input.trim() || loading} className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"><Send size={20} /></button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}