"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
    X, Send, Mail, Phone, GraduationCap, AlertCircle, 
    FileText, CheckCircle, Upload, Check, Loader2 
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { UserService } from "@/services/userService";
import { ApplicationService } from "@/services/applicationService";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface ApplyJobDialogProps {
    jobId: string;
    jobTitle: string;
    jobType: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ApplyJobDialog({ jobId, jobTitle, jobType, isOpen, onClose, onSuccess }: ApplyJobDialogProps) {
    const { user, profile, refreshProfile } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    // CV states
    const isUnskilled = jobType === "unskilled";
    const [cvSource, setCvSource] = useState<"existing" | "upload">("existing");
    const [newFile, setNewFile] = useState<File | null>(null);
    const [uploadingCv, setUploadingCv] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        education: ""
    });

    useEffect(() => {
        setMounted(true);
        if (isOpen && profile) {
            setFormData({
                email: user?.email || "",
                phone: profile.phone || "",
                education: profile.education || ""
            });
            // Default to upload if no existing CV
            if (!profile.cvUrl) {
                setCvSource("upload");
            } else {
                setCvSource("existing");
            }
        }
    }, [isOpen, profile, user]);

    if (!isOpen || !mounted) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.phone) return alert("Vui lòng nhập số điện thoại để nhà tuyển dụng liên hệ!");
        
        // CV validation for skilled/professional jobs
        let finalCvUrl = profile?.cvUrl || "";
        if (!isUnskilled) {
            if (cvSource === "upload") {
                if (!newFile) return alert("Vui lòng chọn file CV để tải lên!");
                
                setUploadingCv(true);
                try {
                    // If user has NO cv yet, we use the UserService.uploadCV which updates profile too
                    // Otherwise just upload via ApplicationService to get a URL for this application only
                    if (!profile?.cvUrl) {
                        const res = await UserService.uploadCV(newFile);
                        finalCvUrl = res.url;
                    } else {
                        finalCvUrl = await ApplicationService.uploadCV(newFile);
                    }
                } catch (error) {
                    console.error("Upload CV failed", error);
                    alert("Tải lên CV thất bại.");
                    setUploadingCv(false);
                    return;
                } finally {
                    setUploadingCv(false);
                }
            } else {
                if (!finalCvUrl) return alert("Bạn chưa có CV trong hồ sơ. Vui lòng chọn Tải lên CV.");
            }
        }

        setSubmitting(true);
        try {
            // 1. Submit Application (Use placeholder CV for unskilled if empty)
            await ApplicationService.submitApplication(jobId, profile?.id || "", finalCvUrl || "unskilled-no-cv");

            // 2. Sync Profile Info
            const hasInfoChanges = formData.phone !== (profile?.phone || "") || 
                                   formData.education !== (profile?.education || "");
            
            if (hasInfoChanges && profile?.id) {
                await UserService.updateProfile(profile.id, {
                    phone: formData.phone,
                    education: formData.education
                });
            }
            
            await refreshProfile();
            onSuccess();
        } catch (error: any) {
            console.error("Application failed", error);
            const message = error.message || "Ứng tuyển thất bại. Vui lòng thử lại sau.";
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden transform transition-all scale-100 border border-gray-100 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
                            <Send className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Gửi hồ sơ ứng tuyển</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5 line-clamp-1">
                                {jobTitle}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full p-1.5 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                        
                        {/* 1. CV Selection (Only for skilled jobs) */}
                        {!isUnskilled && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-900">
                                    <FileText size={20} className="text-blue-600" />
                                    <h3 className="font-black uppercase text-[10px] tracking-[0.2em]">Hồ sơ năng lực (CV)</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {profile?.cvUrl && (
                                        <div 
                                            onClick={() => setCvSource("existing")}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                                                cvSource === "existing" ? "border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100" : "border-gray-100 bg-white hover:border-gray-200"
                                            }`}
                                        >
                                            {cvSource === "existing" && <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-0.5"><Check size={12}/></div>}
                                            <p className="text-xs font-black text-gray-900 uppercase">Dùng CV hiện tại</p>
                                            <p className="text-[10px] text-gray-500 truncate">{profile.cvUrl.split('/').pop()}</p>
                                        </div>
                                    )}
                                    <div 
                                        onClick={() => setCvSource("upload")}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                                            cvSource === "upload" ? "border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-100" : "border-gray-100 bg-white hover:border-gray-200"
                                        }`}
                                    >
                                        {cvSource === "upload" && <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-0.5"><Check size={12}/></div>}
                                        <p className="text-xs font-black text-gray-900 uppercase">Tải lên CV mới</p>
                                        <p className="text-[10px] text-gray-500">{newFile ? newFile.name : "Chọn file .pdf, .doc"}</p>
                                    </div>
                                </div>

                                {cvSource === "upload" && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                        <input 
                                            type="file" 
                                            id="cv-upload" 
                                            className="hidden" 
                                            accept=".pdf,.doc,.docx" 
                                            onChange={handleFileChange}
                                        />
                                        <label 
                                            htmlFor="cv-upload"
                                            className="flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed border-gray-200 rounded-[1.5rem] hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <Upload size={20} className="text-gray-400" />
                                            <span className="text-sm font-bold text-gray-600">
                                                {newFile ? "Thay đổi file đã chọn" : "Nhấn để chọn file CV từ máy"}
                                            </span>
                                        </label>
                                        {!profile?.cvUrl && (
                                            <div className="mt-3 flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                                <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-[10px] text-amber-700 font-bold leading-tight">
                                                    Bạn chưa có CV trong hồ sơ. File này sẽ được lưu làm CV chính của bạn.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. Contact Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-gray-900">
                                <Phone size={20} className="text-blue-600" />
                                <h3 className="font-black uppercase text-[10px] tracking-[0.2em]">Thông tin liên hệ</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Input label="Số điện thoại" icon={Phone} placeholder="090..." value={formData.phone} required onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                <Input label="Email ứng tuyển" icon={Mail} value={formData.email} readOnly className="opacity-60" />
                            </div>

                            <Input 
                                isTextArea 
                                label="Trình độ học vấn" 
                                icon={GraduationCap} 
                                placeholder="Ví dụ: Cử nhân CNTT..." 
                                rows={2} 
                                value={formData.education} 
                                onChange={(e) => setFormData({...formData, education: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hành động</span>
                            <span className="text-xs font-bold text-blue-600">Xác nhận nộp đơn</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" type="button" onClick={onClose} className="border-none shadow-none bg-transparent">Hủy bỏ</Button>
                            <Button type="submit" isLoading={submitting || uploadingCv} icon={submitting ? undefined : Send} className="px-10">
                                {uploadingCv ? "Đang tải CV..." : "Nộp hồ sơ ngay"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}