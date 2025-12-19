"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [location, setLocation] = useState(searchParams.get("location") || "");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (location) params.set("location", location);
        router.push(`/jobs?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-grow">
                <label htmlFor="search" className="sr-only">Search Jobs</label>
                <input
                    type="text"
                    id="search"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Job title, keywords..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div className="flex-grow">
                <label htmlFor="location" className="sr-only">Location</label>
                <input
                    type="text"
                    id="location"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>
            <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Search
            </button>
        </form>
    );
}
