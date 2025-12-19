"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar({ initialSearch }: { initialSearch?: string }) {
    const [search, setSearch] = useState(initialSearch || "");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/?search=${encodeURIComponent(search.trim())}`);
        } else {
            router.push("/");
        }
    };

    return (
        <form onSubmit={handleSearch} className="mt-1 relative rounded-md shadow-sm w-full max-w-lg">
            <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 pr-20 sm:text-sm border-gray-300 rounded-md py-3"
                placeholder="Search by title, tags, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                    type="submit"
                    className="h-full px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-r-md"
                >
                    Search
                </button>
            </div>
        </form>
    );
}
