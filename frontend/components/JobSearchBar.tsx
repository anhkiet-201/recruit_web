"use client";

import { Search, MapPin } from "lucide-react";
import TitleSelector from "./TitleSelector";
import LocationSelector from "./LocationSelector";
import { useRouter } from "next/navigation";

interface JobSearchBarProps {
    defaultTitle?: string;
    defaultValue?: string;
    currentJobType?: string;
    action?: string;
}

export default function JobSearchBar({ 
    defaultTitle = "", 
    defaultValue = "", 
    currentJobType = "all",
    action = "/jobs"
}: JobSearchBarProps) {
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const location = formData.get("location") as string;
        const jobType = formData.get("jobType") as string;

        const params = new URLSearchParams();
        if (title) params.append("title", title);
        if (location) params.append("location", location);
        if (jobType && jobType !== "all") params.append("jobType", jobType);

        router.push(`${action}?${params.toString()}`);
    };

    return (
        <div className="max-w-4xl mx-auto w-full">
            <form 
                onSubmit={handleSubmit}
                className="bg-white/80 backdrop-blur-xl p-2.5 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col md:flex-row gap-2 relative z-40 transition-all hover:shadow-[0_32px_80px_-12px_rgba(59,130,246,0.1)]"
            >
                <input type="hidden" name="jobType" value={currentJobType} />
                
                <TitleSelector defaultValue={defaultTitle} />

                <div className="hidden md:block w-px h-10 bg-gray-200 self-center opacity-30"></div>
                
                <LocationSelector defaultValue={defaultValue} />

                <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-12 py-4 rounded-[2rem] transition-all active:scale-95 shadow-xl shadow-blue-500/30 whitespace-nowrap"
                >
                    Tìm kiếm
                </button>
            </form>
        </div>
    );
}