"use client";

import { useState, useEffect } from "react";
import { RecruitmentService } from "@/services/recruitmentService";
import { RecruitmentPost } from "@/models/Recruitment";
import { RecruitmentSidebar } from "@/components/recruitment/RecruitmentSidebar";
import { RecruitmentDetail } from "@/components/recruitment/RecruitmentDetail";
import { ArrowLeft } from "lucide-react";

export default function RecruitmentPage() {
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<RecruitmentPost | null>(
    null
  );
  const [aiSearchResults, setAiSearchResults] = useState<RecruitmentPost[]>([]);
  const [searchMetadata, setSearchMetadata] = useState<{
    total: number;
    page: number;
    lastPage: number;
  } | null>(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>("");

  // Initial Fetch
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await RecruitmentService.getAllPosts();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      }
    };
    loadPosts();
  }, []);

  const handleCreatePost = async () => {
    const newPost: Omit<RecruitmentPost, "id"> = {
      companyName: "Tên công ty",
      address: "Địa chỉ",
      positions: [],
    };
    try {
      const created = await RecruitmentService.createPost(newPost);
      setPosts([created, ...posts]);
      setSelectedPost(created);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleUpdatePost = async (
    id: string,
    updates: Partial<RecruitmentPost>
  ) => {
    try {
      // Optimistic update
      const updatedPosts = posts.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      setPosts(updatedPosts);
      if (selectedPost?.id === id)
        setSelectedPost({ ...selectedPost, ...updates });

      await RecruitmentService.updatePost(id, updates);
    } catch (error) {
      console.error("Failed to update post:", error);
      // Revert on error by refetching
      try {
        const data = await RecruitmentService.getAllPosts();
        setPosts(data);
      } catch (refetchError) {
        console.error("Failed to refetch posts:", refetchError);
      }
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài tuyển dụng này?")) return;
    try {
      await RecruitmentService.deletePost(id);
      setPosts(posts.filter((p) => p.id !== id));
      if (selectedPost?.id === id) setSelectedPost(null);
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleAiSearch = async (query: string, page: number = 1) => {
    try {
      const response = await RecruitmentService.searchSemantic(query, page, 10);
      setAiSearchResults(response.items);
      setSearchMetadata({
        total: response.total,
        page: response.page,
        lastPage: response.lastPage,
      });
      setCurrentSearchQuery(query);
    } catch (error) {
      console.error("AI Search failed:", error);
      setAiSearchResults([]);
      setSearchMetadata(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className={`w-full md:w-1/3 flex flex-col ${
          selectedPost ? "hidden md:flex" : "flex"
        }`}
      >
        <RecruitmentSidebar
          posts={posts}
          selectedPostId={selectedPost?.id}
          onSelectPost={setSelectedPost}
          onCreatePost={handleCreatePost}
          onAiSearch={handleAiSearch}
          aiSearchResults={aiSearchResults}
          searchMetadata={searchMetadata}
          onClearAiResults={() => {
            setAiSearchResults([]);
            setSearchMetadata(null);
            setCurrentSearchQuery("");
          }}
        />
      </div>

      <div
        className={`flex-1 flex flex-col ${
          selectedPost ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedPost && (
          <div className="md:hidden p-4 border-b border-gray-100 flex items-center gap-2">
            <button
              onClick={() => setSelectedPost(null)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
            <span className="font-medium text-gray-900">
              Quay lại danh sách
            </span>
          </div>
        )}
        <RecruitmentDetail
          post={selectedPost}
          onUpdate={handleUpdatePost}
          onDelete={handleDeletePost}
        />
      </div>
    </div>
  );
}
