"use client";

import React, { useState, useEffect } from "react";
import Dialog from "@/components/ui/Dialog";
import { Sparkles, RefreshCw, CheckCircle2, Copy, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import { RecruitmentService } from "@/services/recruitmentService";
import { useRouter } from "next/navigation";
import { OptimizedJobResponse } from "@/services/aiService";

interface AiPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  positionId: string;
  positionTitle: string;
}

export default function AiPostModal({
  isOpen,
  onClose,
  postId,
  positionId,
  positionTitle,
}: AiPostModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>("");
  const [structuredData, setStructuredData] =
    useState<OptimizedJobResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const generateContent = async () => {
    setLoading(true);
    try {
      const res = await RecruitmentService.generatePosting(postId, positionId);
      setContent(res.displayContent);
      setStructuredData(res.structuredData);
    } catch (error) {
      console.error("Failed to generate posting:", error);
      alert("Không thể tạo bài đăng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !content) {
      generateContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (!structuredData) return;

    // Save to sessionStorage for pre-fill
    sessionStorage.setItem("PREFILL_JOB_DATA", JSON.stringify(structuredData));

    // Navigate to Create New Job
    router.push("/admin/jobs/new");
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="AI Job Posting Generator"
      maxWidth="2xl"
    >
      <div className="flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <Sparkles
                  className="absolute inset-0 m-auto text-blue-600 animate-pulse"
                  size={24}
                />
              </div>
              <p className="text-sm font-bold text-gray-500 animate-pulse">
                AI đang bóc tách dữ liệu và sáng tạo nội dung...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Gợi ý bài đăng cho: {positionTitle}
                </h4>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={14} /> Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Sao chép nội dung
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-sm leading-relaxed text-gray-700 font-medium">
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-white rounded-b-4xl flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={generateContent}
            disabled={loading}
            icon={RefreshCw}
          >
            Tạo lại
          </Button>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || !structuredData}
              icon={Send}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
            >
              Xác nhận & Tạo Job
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
