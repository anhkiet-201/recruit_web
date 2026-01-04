"use client";

import { useState, useEffect } from "react";
import { JobService } from "@/services/jobService";
import {
  getAllTags,
  createTag,
  deleteTag,
  getJobTags,
} from "@/services/tagService";
import { Tag } from "@/models/Tag";
import { Job } from "@/models/Job";
import { VIETNAM_CITIES } from "@/constants/LocationConstants";
import {
  X,
  Save,
  Upload,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Hash,
  Plus,
  Image as ImageIcon,
  User,
  AlertCircle,
  RefreshCw,
  Type,
  Award,
  GraduationCap,
  Zap,
  FileText,
} from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmDialogContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import { Card } from "@/components/ui/Card";
import Image from "next/image";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { AiService } from "@/services/aiService"; // Import AI Service

import { useAuth } from "../AuthProvider";

interface JobFormProps {
  initialData?: Partial<Job>;
  jobId?: string;
  onSubmit: (
    data: Partial<Job>,
    selectedTags: string[],
    initialTags: string[]
  ) => Promise<void>;
  submitLabel: string;
  title: string;
}

export default function JobForm({
  initialData,
  jobId,
  onSubmit,
  submitLabel,
}: JobFormProps) {
  const { confirm } = useConfirm();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false); // Modal State
  const [aiRawText, setAiRawText] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [formData, setFormData] = useState<Partial<Job>>({
    title: "",
    content: "",
    location: "",
    salaryMin: 0,
    salaryMax: 0,
    experienceYears: 0,
    imageUrl: "",
    deadline: "",
    jobType: "unskilled",
  });

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [initialTags, setInitialTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const allTags = await getAllTags();
        setAvailableTags(allTags);
      } catch (e) {
        console.error("Load tags failed", e);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        location: initialData.location || "",
        salaryMin: initialData.salaryMin || 0,
        salaryMax: initialData.salaryMax || 0,
        experienceYears: initialData.experienceYears || 0,
        imageUrl: initialData.imageUrl || "",
        deadline: initialData.deadline
          ? new Date(initialData.deadline).toISOString().split("T")[0]
          : "",
        jobType: initialData.jobType || "unskilled",
      });
    }

    const fetchJobTags = async () => {
      if (jobId) {
        try {
          const jobTags = await getJobTags(jobId);
          const tagIds = jobTags.map((t) => t.id);
          setSelectedTags(tagIds);
          setInitialTags(tagIds);
        } catch (e) {
          console.error("Load job tags failed", e);
        }
      }
    };
    fetchJobTags();
  }, [initialData, jobId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      try {
        const url = await JobService.uploadJobImage(e.target.files[0]);
        setFormData((prev) => ({ ...prev, imageUrl: url }));
      } catch {
        alert("Failed to upload image");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const newTag = await createTag(newTagName.trim());
      setAvailableTags((prev) => [...prev, newTag]);
      setSelectedTags((prev) => [...prev, newTag.id]);
      setNewTagName("");
    } catch {
      alert("Failed to create tag");
    }
  };

  const handleDeleteTag = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete Tag",
      message: "Are you sure you want to permanently delete this tag?",
      confirmText: "Delete",
      isDanger: true,
    });
    if (!ok) return;
    try {
      await deleteTag(tagId);
      setAvailableTags((prev) => prev.filter((t) => t.id !== tagId));
      setSelectedTags((prev) => prev.filter((id) => id !== tagId));
    } catch {
      alert("Failed to delete tag");
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleAiOptimize = async () => {
    if (!aiRawText.trim()) return;
    setIsOptimizing(true);
    try {
      const data = await AiService.optimizeJob(aiRawText);

      setFormData((prev) => ({
        ...prev,
        title: data.title,
        content: data.content,
        location: data.location,
        salaryMin: data.salaryMin || 0,
        salaryMax: data.salaryMax || 0,
        jobType: data.jobType || "unskilled",
        experienceYears: data.experienceYears || 0,
        deadline: data.deadline || "",
      }));

      if (data.skills && data.skills.length > 0) {
        const newSelectedTags = new Set(selectedTags);
        const tagsToCreate: string[] = [];

        data.skills.forEach((skill) => {
          const normalizedSkill = skill.trim();
          if (!normalizedSkill) return;

          const existingTag = availableTags.find(
            (t) => t.name.toLowerCase() === normalizedSkill.toLowerCase()
          );

          if (existingTag) {
            newSelectedTags.add(existingTag.id);
          } else {
            // Check if we already plan to create this tag (deduplicate)
            const isAlreadyPlanned = tagsToCreate.some(
              (t) => t.toLowerCase() === normalizedSkill.toLowerCase()
            );
            if (!isAlreadyPlanned) {
              tagsToCreate.push(normalizedSkill);
            }
          }
        });

        // 2. Create new tags in parallel
        if (tagsToCreate.length > 0) {
          try {
            const createdTags = await Promise.all(
              tagsToCreate.map((name) => createTag(name))
            );

            // Update available tags state
            setAvailableTags((prev) => [...prev, ...createdTags]);

            // Add new tag IDs to selection
            createdTags.forEach((tag) => newSelectedTags.add(tag.id));
          } catch (e) {
            console.error("Failed to auto-create some tags", e);
            // Non-blocking: continue with what we have
          }
        }

        setSelectedTags(Array.from(newSelectedTags));
      }

      setIsAiModalOpen(false);
      setAiRawText("");
    } catch (error) {
      console.error("Optimize failed", error);
      alert("Không thể tối ưu hóa nội dung. Vui lòng thử lại.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData, selectedTags, initialTags);
    } finally {
      setLoading(false);
    }
  };

  const jobTypeOptions = [
    { value: "unskilled", label: "Lao động phổ thông", icon: Zap },
    { value: "professional", label: "Nhân sự cấp cao", icon: Award },
    { value: "skilled", label: "Lao động có bằng cấp", icon: GraduationCap },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-32"
    >
      {/* Main Content - Left Column */}
      <div className="xl:col-span-2 space-y-8">
        {profile?.role === "employer" && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 text-blue-800 text-sm font-bold shadow-sm">
            <AlertCircle className="text-blue-600 shrink-0" size={20} />
            <p>
              Lưu ý: Tin tuyển dụng của bạn sẽ được Admin kiểm duyệt trước khi
              hiển thị chính thức trên hệ thống.
            </p>
          </div>
        )}
        {/* Basic Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Nội dung tuyển dụng
            </h3>
          </div>
          <Card
            noPadding
            className="border-none shadow-xl shadow-gray-100/50 overflow-hidden"
          >
            <div className="p-8 space-y-8">
              <Input
                icon={Type}
                label="Tiêu đề công việc"
                required
                placeholder="Ví dụ: Senior React Developer"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.15em]">
                    Mô tả chi tiết *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Zap size={14} className="fill-violet-600" />
                    AI Optimize
                  </button>
                </div>
                <RichTextEditor
                  value={formData.content || ""}
                  onChange={(html) =>
                    setFormData({ ...formData, content: html })
                  }
                  placeholder="Mô tả chi tiết về công việc, yêu cầu ứng viên, quyền lợi..."
                  minHeight="400px"
                  maxLength={10000}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Media Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ImageIcon size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Hình ảnh minh họa
            </h3>
          </div>
          <Card
            noPadding
            className="border-none shadow-xl shadow-gray-100/50 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-4xl p-12 hover:bg-gray-50/50 hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden group">
                {formData.imageUrl ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={formData.imageUrl}
                      alt="Job Cover"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                      <p className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                        <Upload size={18} /> Thay đổi ảnh
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="mx-auto h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300 shadow-sm">
                      <ImageIcon size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        Tải ảnh bìa
                      </p>
                      <p className="text-xs text-gray-400 font-medium">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                    <RefreshCw
                      size={40}
                      className="animate-spin text-blue-600 mb-2"
                    />
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                      Đang tải lên...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sidebar - Right Column */}
      <div className="space-y-8">
        {/* Actions */}
        <div className="bg-white p-4 rounded-2xl shadow-xl shadow-gray-100/50 sticky top-4 z-10 border border-gray-50">
          <Button
            icon={Save}
            className="w-full py-4 text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
            isLoading={loading}
          >
            {submitLabel}
          </Button>
        </div>

        {/* Job Specifics */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Briefcase size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Chi tiết công việc
            </h3>
          </div>
          <Card
            noPadding
            className="border-none shadow-xl shadow-gray-100/50 overflow-hidden"
          >
            <div className="p-6 space-y-6">
              <Dropdown
                icon={User}
                label="Loại hình công việc"
                options={jobTypeOptions}
                value={formData.jobType || "unskilled"}
                onChange={(val) => setFormData({ ...formData, jobType: val })}
              />

              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.15em] ml-2">
                  Mức lương (VND)
                </label>
                <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-gray-50/30">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      <tr className="group hover:bg-white transition-colors">
                        <td className="px-4 py-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest w-1/3 align-middle group-hover:text-blue-600 transition-colors">
                          Min
                        </td>
                        <td className="p-1 w-2/3">
                          <Input
                            icon={DollarSign}
                            value={
                              formData.salaryMin
                                ? formData.salaryMin.toLocaleString("vi-VN")
                                : ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                salaryMin: Number(
                                  e.target.value.replace(/\./g, "")
                                ),
                              })
                            }
                            className="space-y-0!"
                            inputClassName="!border-none !shadow-none !rounded-lg focus:!ring-0 !bg-transparent text-xs !font-bold text-gray-700 w-full text-right"
                          />
                        </td>
                      </tr>
                      <tr className="group hover:bg-white transition-colors">
                        <td className="px-4 py-4 font-bold text-[10px] text-gray-400 uppercase tracking-widest w-1/3 align-middle group-hover:text-blue-600 transition-colors">
                          Max
                        </td>
                        <td className="p-1 w-2/3">
                          <Input
                            icon={DollarSign}
                            value={
                              formData.salaryMax
                                ? formData.salaryMax.toLocaleString("vi-VN")
                                : ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                salaryMax: Number(
                                  e.target.value.replace(/\./g, "")
                                ),
                              })
                            }
                            className="space-y-0!"
                            inputClassName="!border-none !shadow-none !rounded-lg focus:!ring-0 !bg-transparent text-xs !font-bold text-gray-700 w-full text-right"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  icon={MapPin}
                  label="Địa điểm làm việc"
                  required
                  list="vietnam-cities"
                  placeholder="Ví dụ: Hồ Chí Minh, Quận 1"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
                <datalist id="vietnam-cities">
                  {VIETNAM_CITIES.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-400 ml-2 font-medium">
                  💡 Gợi ý: &quot;Hồ Chí Minh&quot; hoặc &quot;Hà Nội, Quận Hoàn
                  Kiếm&quot;
                </p>
              </div>
              <Input
                icon={Briefcase}
                label="Kinh nghiệm (Năm)"
                type="number"
                min={0}
                value={formData.experienceYears}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experienceYears: Math.max(0, Number(e.target.value)),
                  })
                }
              />
              <Input
                icon={Calendar}
                label="Hạn nộp hồ sơ"
                type="date"
                value={formData.deadline as string}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </div>
          </Card>
        </div>

        {/* Tags Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Hash size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tags & Kỹ năng</h3>
          </div>
          <Card
            noPadding
            className="border-none shadow-xl shadow-gray-100/50 overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Thêm tag mới..."
                  className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-gray-400"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleCreateTag())
                  }
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="bg-gray-900 text-white px-4 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gray-900/20"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {availableTags.map((tag) => (
                  <div
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`
                                            group flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer border transition-all duration-300
                                            ${
                                              selectedTags.includes(tag.id)
                                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 ring-2 ring-blue-600/20"
                                                : "bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:shadow-sm"
                                            }
                                        `}
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTag(tag.id, e)}
                      className={`p-0.5 rounded-md transition-all ${
                        selectedTags.includes(tag.id)
                          ? "text-blue-200 hover:text-white hover:bg-white/20"
                          : "text-gray-300 hover:text-red-500 hover:bg-red-50"
                      }`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
      {/* AI Optimization Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                  <Zap size={24} className="fill-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    AI Tin Tuyển Dụng
                  </h3>
                  <p className="text-sm text-gray-500">
                    Dán nội dung thô để AI tự động điền thông tin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isOptimizing}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <textarea
                className="w-full h-64 p-4 rounded-xl border-2 border-dashed border-gray-200 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 resize-none transition-all text-sm leading-relaxed"
                placeholder="Dán nội dung tuyển dụng vào đây...
Ví dụ: 
Hà Nội - Tuyển dụng Senior Dev, lương 20-30tr.
Yêu cầu: 3 năm kinh nghiệm React, biết Tiếng Anh.
Quyền lợi: Thưởng tháng 13, BHXH full lương..."
                value={aiRawText}
                onChange={(e) => setAiRawText(e.target.value)}
                disabled={isOptimizing}
              ></textarea>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isOptimizing}
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleAiOptimize}
                disabled={!aiRawText.trim() || isOptimizing}
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200"
              >
                {isOptimizing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang phân tích...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="fill-white" />
                    <span>Tự động điền</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
