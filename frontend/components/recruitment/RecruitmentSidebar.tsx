"use client";

import { useState } from "react";
import { RecruitmentPost } from "@/models/Recruitment";
import { Plus, Search } from "lucide-react";

interface RecruitmentSidebarProps {
  posts: RecruitmentPost[];
  selectedPostId: string | undefined;
  onSelectPost: (post: RecruitmentPost) => void;
  onCreatePost: () => void;
  onAiSearch: (query: string, page?: number) => Promise<void>;
  aiSearchResults: RecruitmentPost[];
  searchMetadata: {
    total: number;
    page: number;
    lastPage: number;
  } | null;
  onClearAiResults: () => void;
}

export function RecruitmentSidebar({
  posts,
  selectedPostId,
  onSelectPost,
  onCreatePost,
  onAiSearch,
  aiSearchResults,
  searchMetadata,
  onClearAiResults,
}: RecruitmentSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    await onAiSearch(searchQuery);
    setIsAiSearching(false);
  };

  return (
    <div className="w-full h-full border-r border-gray-200 flex flex-col bg-gray-50/30">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Tuyển dụng</h2>
          <button
            onClick={onCreatePost}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm hoặc hỏi AI..."
            className="w-full pl-9 pr-12 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className={`absolute right-2 top-1.5 p-1 rounded-md text-xs font-bold ${
              isAiSearching
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {isAiSearching ? "..." : "AI"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {aiSearchResults.length > 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-blue-600 uppercase">
                  Kết quả AI ({searchMetadata?.total || 0})
                </h3>
                <button
                  onClick={onClearAiResults}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Xóa
                </button>
              </div>
              <div className="space-y-2">
                {aiSearchResults.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onSelectPost(post)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPostId === post.id
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200 hover:bg-blue-50/50"
                    }`}
                  >
                    <h4 className="font-bold text-gray-800 text-sm">
                      {post.companyName}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {post.address}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-full font-medium">
                        {post.positions.length} vị trí
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {searchMetadata && searchMetadata.lastPage > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  disabled={searchMetadata.page === 1}
                  onClick={() =>
                    onAiSearch(searchQuery, searchMetadata.page - 1)
                  }
                  className="px-3 py-1 text-sm text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed rounded hover:bg-blue-50 transition"
                >
                  ← Trước
                </button>
                <span className="text-xs text-gray-600 font-medium">
                  Trang {searchMetadata.page} / {searchMetadata.lastPage}
                </span>
                <button
                  disabled={searchMetadata.page === searchMetadata.lastPage}
                  onClick={() =>
                    onAiSearch(searchQuery, searchMetadata.page + 1)
                  }
                  className="px-3 py-1 text-sm text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed rounded hover:bg-blue-50 transition"
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedPostId === post.id
                    ? "bg-white border-l-4 border-l-blue-600 shadow-sm"
                    : "hover:bg-gray-100 border-l-4 border-l-transparent"
                }`}
              >
                <h3 className="font-bold text-gray-800 truncate">
                  {post.companyName || "Công ty chưa đặt tên"}
                </h3>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {post.address || "Chưa có địa chỉ"}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full font-medium">
                    {post.positions.length} Vị trí
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
