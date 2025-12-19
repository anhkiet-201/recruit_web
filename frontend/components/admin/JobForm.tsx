"use client";

import { useState, useEffect } from "react";
import { JobService } from "@/services/jobService";
import { getAllTags, createTag, addTagToJob, deleteTag, removeTagFromJob, getJobTags } from "@/services/tagService";
import { Tag } from "@/models/Tag";
import { X, Save, Upload, MapPin, DollarSign, Calendar, Briefcase, Hash, Plus, Image as ImageIcon, User, AlertCircle } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmDialogContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import { Card, CardHeader } from "@/components/ui/Card";

interface JobFormProps {
    initialData?: any;
    jobId?: string;
    onSubmit: (data: any, selectedTags: string[], initialTags: string[]) => Promise<void>;
    submitLabel: string;
    title: string;
}

export default function JobForm({ initialData, jobId, onSubmit, submitLabel, title }: JobFormProps) {
    const { confirm } = useConfirm();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: "", content: "", location: "", salaryMin: 0, salaryMax: 0,
        experienceYears: 0, imageUrl: "", deadline: "", jobType: "unskilled"
    });

    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [initialTags, setInitialTags] = useState<string[]>([]);
    const [newTagName, setNewTagName] = useState("");

    useEffect(() => {
        loadBaseData();
    }, []);

    const loadBaseData = async () => {
        try {
            const allTags = await getAllTags();
            setAvailableTags(allTags);

            if (initialData) {
                setFormData({
                    title: initialData.title || "",
                    content: initialData.content || "",
                    location: initialData.location || "",
                    salaryMin: initialData.salaryMin || 0,
                    salaryMax: initialData.salaryMax || 0,
                    experienceYears: initialData.experienceYears || 0,
                    imageUrl: initialData.imageUrl || "",
                    deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : "",
                    jobType: initialData.jobType || "unskilled"
                });

                if (jobId) {
                    const jobTags = await getJobTags(jobId);
                    const tagIds = jobTags.map(t => t.id);
                    setSelectedTags(tagIds);
                    setInitialTags(tagIds);
                }
            }
        } catch (e) { console.error("Load form data failed", e); }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const url = await JobService.uploadJobImage(e.target.files[0]);
                setFormData({ ...formData, imageUrl: url });
            } catch (error) { alert("Failed to upload image"); } finally { setUploading(false); }
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        try {
            const newTag = await createTag(newTagName.trim());
            setAvailableTags([...availableTags, newTag]);
            setSelectedTags([...selectedTags, newTag.id]);
            setNewTagName("");
        } catch (error) { alert("Failed to create tag"); }
    };

    const handleDeleteTag = async (tagId: string, e: React.MouseEvent) => {
        e.stopPropagation(); 
        const ok = await confirm({
            title: "Delete Tag",
            message: "Are you sure you want to permanently delete this tag?",
            confirmText: "Delete",
            isDanger: true
        });
        if (!ok) return;
        try {
            await deleteTag(tagId);
            setAvailableTags(availableTags.filter(t => t.id !== tagId));
            setSelectedTags(selectedTags.filter(id => id !== tagId));
        } catch (error) { alert("Failed to delete tag"); }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData, selectedTags, initialTags);
        } finally { setLoading(false); }
    };

    const jobTypeOptions = [
        { value: "unskilled", label: "Lao động phổ thông", icon: Zap },
        { value: "skilled", label: "Lao động chất lượng cao", icon: Award },
        { value: "professional", label: "Lao động có bằng cấp", icon: GraduationCap },
    ];

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            <div className="lg:col-span-2 space-y-8">
                <Card noPadding className="border-none shadow-2xl">
                    <CardHeader title={title} subtitle="Thông tin nội dung công việc tuyển dụng" />
                    <div className="p-8 space-y-8">
                        <Input label="Job Title" required placeholder="Ví dụ: Senior React Developer" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        <Input isTextArea label="Job Description" required rows={12} placeholder="Mô tả công việc, yêu cầu..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                    </div>
                </Card>

                <Card noPadding className="border-none shadow-2xl">
                    <CardHeader title="Cover Image" subtitle="Hình ảnh đại diện cho tin tuyển dụng" />
                    <div className="p-8">
                        <div className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-[2.5rem] p-10 hover:bg-gray-50/50 transition-all cursor-pointer relative overflow-hidden group">
                            {formData.imageUrl ? (
                                <div className="relative w-full h-64 rounded-3xl overflow-hidden shadow-lg">
                                    <img src={formData.imageUrl} alt="Job Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                        <p className="text-white font-black uppercase tracking-widest text-xs">Thay đổi ảnh</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="mx-auto h-16 w-16 text-gray-200 mb-4 group-hover:scale-110 transition-transform"><ImageIcon size={64} /></div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Kéo thả hoặc nhấn để tải ảnh</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><RefreshCw size={32} className="animate-spin text-blue-600" /></div>}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="space-y-8">
                <Card noPadding className="border-none shadow-2xl">
                    <CardHeader title="Job Specifics" />
                    <div className="p-8 space-y-6">
                        <Input icon={MapPin} label="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input icon={DollarSign} label="Min ($)" type="number" value={formData.salaryMin} onChange={e => setFormData({...formData, salaryMin: Number(e.target.value)})} />
                            <Input icon={DollarSign} label="Max ($)" type="number" value={formData.salaryMax} onChange={e => setFormData({...formData, salaryMax: Number(e.target.value)})} />
                        </div>
                        <Input icon={Briefcase} label="Experience" type="number" value={formData.experienceYears} onChange={e => setFormData({...formData, experienceYears: Number(e.target.value)})} />
                        <Input icon={Calendar} label="Deadline" type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                        <Dropdown icon={User} label="Job Type" options={jobTypeOptions} value={formData.jobType} onChange={val => setFormData({...formData, jobType: val})} />
                    </div>
                </Card>

                <Card noPadding className="border-none shadow-2xl">
                    <CardHeader title="Tags & Skills" />
                    <div className="p-8">
                        <div className="flex gap-2 mb-6"><input type="text" placeholder="Thêm tag..." className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold" value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())} /><button type="button" onClick={handleCreateTag} className="bg-gray-900 text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all"><Plus size={20}/></button></div>
                        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto no-scrollbar">
                            {availableTags.map(tag => (
                                <div key={tag.id} onClick={() => toggleTag(tag.id)} className={`group flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer border transition-all ${selectedTags.includes(tag.id) ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"}`}>
                                    <span>{tag.name}</span>
                                    <button type="button" onClick={e => handleDeleteTag(tag.id, e)} className={`p-1 rounded-lg transition-colors ${selectedTags.includes(tag.id) ? "text-white/50 hover:text-white" : "text-gray-300 hover:text-red-500 hover:bg-red-50"}`}><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <div className="pt-4"><Button icon={Save} className="w-full py-5 text-lg" isLoading={loading}>{submitLabel}</Button></div>
            </div>
        </form>
    );
}

import { RefreshCw } from "lucide-react";
