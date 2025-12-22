"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Sparkles, Wand2, MessageSquare } from "lucide-react";
import TitleSelector from "./TitleSelector";
import LocationSelector from "./LocationSelector";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface JobSearchBarProps {
    defaultTitle?: string;
    defaultValue?: string;
    currentJobType?: string;
    action?: string;
    initialAiMode?: boolean;
}

export default function JobSearchBar({
    defaultTitle = "",
    defaultValue = "",
    currentJobType = "all",
    action = "/jobs",
    initialAiMode = true
}: JobSearchBarProps) {
    const router = useRouter();
    const t = useTranslations("JobSearchBar");
    // Default to AI Semantic Mode (true) for better user experience
    const [isAiMode, setIsAiMode] = useState(initialAiMode);

    // Shared search term state for both modes
    const [searchTerm, setSearchTerm] = useState(defaultTitle);

    // Sync state when prop changes (e.g. Triggered by Chatbot AI Search)
    useEffect(() => {
        setIsAiMode(initialAiMode);
        if (defaultTitle) setSearchTerm(defaultTitle);
    }, [initialAiMode, defaultTitle]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        // Use state value for title instead of formData to ensure consistency
        const text = searchTerm;
        const location = formData.get("location") as string;
        const jobType = formData.get("jobType") as string;

        const params = new URLSearchParams();
        if (text) params.append(isAiMode ? "ai_q" : "title", text);

        // Only add location if not in AI mode
        if (!isAiMode && location) params.append("location", location);

        if (jobType && jobType !== "all") params.append("jobType", jobType);

        router.push(`${action}?${params.toString()}`);
    };

    return (
        <div className="max-w-4xl mx-auto w-full space-y-6">
            {/* Mode Selector - Modern Pill Design */}
            <div className="flex justify-center">
                <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 border border-gray-100 shadow-xl">
                    <button
                        type="button"
                        onClick={() => setIsAiMode(false)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${!isAiMode ? "bg-white text-gray-900 shadow-lg shadow-gray-200/50" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        {t('standardSearch')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAiMode(true)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isAiMode ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-400 hover:text-gray-600"}`}
                    >
                        <Sparkles size={12} className={isAiMode ? "fill-white" : ""} />
                        {t('aiSemantic')}
                    </button>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className={`bg-white/80 backdrop-blur-xl p-2.5 rounded-[2.5rem] shadow-2xl border flex flex-col md:flex-row gap-2 relative z-40 transition-all duration-500 ease-out ${isAiMode ? "border-blue-200 ring-8 ring-blue-500/5 shadow-blue-100" : "border-gray-100 shadow-gray-200/50"}`}
            >
                <input type="hidden" name="jobType" value={currentJobType} />

                {/* AI Mode: Single Large Input | Normal Mode: Split Inputs */}
                {isAiMode ? (
                    <div className="flex-1 relative group animate-in fade-in zoom-in-95 duration-300">
                        <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                        <input
                            name="title"
                            type="text"
                            autoComplete="off"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('aiPlaceholder')}
                            className="w-full pl-14 pr-4 py-4 rounded-[1.8rem] border-none focus:ring-0 text-gray-900 bg-transparent font-bold placeholder:text-gray-300 placeholder:font-medium"
                        />
                    </div>
                ) : (
                    <>
                        <TitleSelector
                            defaultValue={defaultTitle}
                            value={searchTerm}
                            onChange={setSearchTerm}
                        />
                        <div className="hidden md:block w-px h-10 bg-gray-200 self-center opacity-30"></div>
                        <LocationSelector defaultValue={defaultValue} />
                    </>
                )}

                <button
                    type="submit"
                    className={`flex items-center justify-center gap-2 font-black px-12 py-4 rounded-[2rem] transition-all active:scale-95 shadow-xl whitespace-nowrap ${isAiMode ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30" : "bg-gray-900 hover:bg-black text-white"}`}
                >
                    {isAiMode ? (
                        <>
                            <Wand2 size={18} />
                            <span>{t('aiAnalyze')}</span>
                        </>
                    ) : (
                        <span>{t('searchNow')}</span>
                    )}
                </button>
            </form>

            {/* AI Mode Tip */}
            {isAiMode && (
                <p className="text-center text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-in slide-in-from-top-2">
                    {t('aiTip')}
                </p>
            )}
        </div>
    );
}