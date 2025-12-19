"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ApplicationService } from "@/services/applicationService";
import { UserService } from "@/services/userService";
import { Application } from "@/models/User";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardFooter } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { 
    User, Mail, Phone, MapPin, GraduationCap, 
    Wrench, FileText, Clock, ChevronRight, Edit2, 
    Save, X, Upload, ExternalLink, CheckCircle, Briefcase, RefreshCw, AlertCircle, Camera
} from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
    const { user, profile, loading, refreshProfile } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [cvUploading, setCvUploading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    
    const cvInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({ name: "", phone: "", address: "", education: "", skills: "" });

    useEffect(() => {
        if (!loading) {
            if (!user) router.push("/login");
            else {
                const userId = profile?.id || user.uid;
                ApplicationService.getMyApplications(userId).then(setApplications);
                if (profile) setFormData({ name: profile.name || "", phone: profile.phone || "", address: profile.address || "", education: profile.education || "", skills: profile.skills || "" });
            }
        }
    }, [user, profile, loading, router]);

    const handleSaveProfile = async () => {
        if (!profile?.id) return;
        setSaving(true);
        try {
            await UserService.updateProfile(profile.id, formData);
            await refreshProfile();
            setIsEditing(false);
        } catch (error) { alert("Failed to update profile"); } finally { setSaving(false); }
    };

    const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && profile?.id) {
            const file = e.target.files[0];
            
            if (file.type !== 'application/pdf') {
                alert("Vui lòng chỉ tải lên tệp tin định dạng PDF.");
                if (cvInputRef.current) cvInputRef.current.value = "";
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert("File is too large. Maximum size is 10MB.");
                return;
            }

            setCvUploading(true);
            try {
                await UserService.uploadCV(file);
                await refreshProfile();
            } catch (error) { alert("Upload failed"); } finally { 
                setCvUploading(false); 
                if (cvInputRef.current) cvInputRef.current.value = "";
            }
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && profile?.id) {
            setAvatarUploading(true);
            try {
                await UserService.uploadAvatar(e.target.files[0]);
                await refreshProfile();
            } catch (error) { alert("Avatar upload failed"); } finally { 
                setAvatarUploading(false); 
                if (avatarInputRef.current) avatarInputRef.current.value = "";
            }
        }
    };

    const getFileName = (url: string) => {
        if (!url) return "";
        const parts = url.split('/');
        const fullName = parts[parts.length - 1];
        const nameParts = fullName.split('-');
        return nameParts.length > 1 ? nameParts.slice(1).join('-') : fullName;
    };

    if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* LEFT COL */}
                <div className="space-y-8">
                    <Card noPadding className="border-none shadow-2xl relative overflow-visible">
                        <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-t-[2rem]"></div>
                        <div className="px-8 pb-8">
                            <div className="relative flex justify-center">
                                <div className="-mt-16 h-32 w-32 bg-white rounded-[2.5rem] p-1.5 shadow-2xl group cursor-pointer overflow-hidden relative border-4 border-white transition-transform hover:scale-105 duration-500">
                                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                    <div onClick={() => avatarInputRef.current?.click()} className="h-full w-full bg-gray-50 rounded-[2rem] flex items-center justify-center text-blue-600 font-black text-4xl overflow-hidden relative">
                                        {profile?.avatarUrl ? <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized /> : (profile?.name || user.email)?.[0].toUpperCase()}
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <Camera size={24} className="text-white mb-1" />
                                            <span className="text-[10px] text-white font-black uppercase tracking-widest">Update</span>
                                        </div>
                                        {avatarUploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10"><RefreshCw size={24} className="animate-spin text-blue-600" /></div>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-6">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{profile?.name || "Member"}</h2>
                                <Badge variant={profile?.role === 'admin' ? "purple" : "blue"} className="mt-2">{profile?.role || "Candidate"}</Badge>
                            </div>

                            <div className="mt-10 space-y-5 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><Mail size={18} className="text-blue-500" /> <span>{user.email}</span></div>
                                <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><Phone size={18} className="text-blue-500" /> <span>{profile?.phone || "N/A"}</span></div>
                                <div className="flex items-center gap-4 text-sm font-bold text-gray-600"><MapPin size={18} className="text-blue-500" /> <span className="truncate">{profile?.address || "N/A"}</span></div>
                            </div>

                            <Button variant={isEditing ? "danger" : "outline"} className="w-full mt-8" icon={isEditing ? X : Edit2} onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Cancel" : "Edit Profile"}</Button>
                        </div>
                    </Card>

                    <Card className="border-none shadow-2xl">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Activity Overview</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50/50 rounded-[1.5rem] p-5 text-center border border-blue-100">
                                <p className="text-3xl font-black text-blue-700">{applications.length}</p>
                                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Applications</p>
                            </div>
                            <div className="bg-indigo-50/50 rounded-[1.5rem] p-5 text-center border border-indigo-100">
                                <p className="text-3xl font-black text-indigo-700">{applications.filter(a => a.status === 'accepted').length}</p>
                                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">Offers</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* RIGHT COL */}
                <div className="lg:col-span-2 space-y-10">
                    
                    <Card noPadding className="border-none shadow-2xl">
                        <CardHeader title="Professional Profile" subtitle="Your expertise and background" action={isEditing && <Button size="sm" icon={Save} isLoading={saving} onClick={handleSaveProfile}>Save Info</Button>} />
                        
                        <div className="p-8 space-y-10">
                            <section className="space-y-5">
                                <div className="flex items-center gap-2 text-gray-900"><User size={20} className="text-blue-600" /><h3 className="font-black uppercase text-xs tracking-widest">Personal Details</h3></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Full Name" value={isEditing ? formData.name : (profile?.name || "N/A")} readOnly={!isEditing} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    <Input label="Phone" value={isEditing ? formData.phone : (profile?.phone || "N/A")} readOnly={!isEditing} helperText={isEditing && <p className="text-[10px] text-amber-600 font-bold flex gap-1 mt-1"><AlertCircle size={12}/> Nhà tuyển dụng sẽ dùng số này để liên hệ.</p>} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                                <Input label="Address" value={isEditing ? formData.address : (profile?.address || "N/A")} readOnly={!isEditing} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </section>

                            <hr className="border-gray-100" />

                            <section className="space-y-5">
                                <div className="flex items-center gap-2 text-gray-900"><GraduationCap size={20} className="text-blue-600" /><h3 className="font-black uppercase text-xs tracking-widest">Education</h3></div>
                                {isEditing ? <Input isTextArea rows={3} value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} /> : <p className="text-sm font-bold text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100">{profile?.education || "Chưa cập nhật thông tin học vấn."}</p>}
                            </section>

                            <section className="space-y-5">
                                <div className="flex items-center gap-2 text-gray-900"><Wrench size={20} className="text-blue-600" /><h3 className="font-black uppercase text-xs tracking-widest">Skills & Expertise</h3></div>
                                {isEditing ? <Input placeholder="React, Node.js, ..." value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} /> : <div className="flex flex-wrap gap-2">{profile?.skills ? profile.skills.split(',').map((s, i) => <Badge key={i} variant="blue">{s.trim()}</Badge>) : <p className="text-xs text-gray-400 italic">Chưa liệt kê kỹ năng.</p>}</div>}
                            </section>

                            <section className="space-y-5">
                                <div className="flex items-center gap-2 text-gray-900"><FileText size={20} className="text-blue-600" /><h3 className="font-black uppercase text-xs tracking-widest">Resume / CV</h3></div>
                                <div className="flex items-center justify-between p-6 bg-blue-50/30 rounded-[2rem] border border-blue-100 shadow-inner">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-md">{cvUploading ? <RefreshCw size={24} className="animate-spin" /> : <FileText size={24} />}</div>
                                        <div className="min-w-0"><p className="text-sm font-black text-gray-900 truncate max-w-[200px]">{cvUploading ? "Uploading..." : (profile?.cvUrl ? getFileName(profile.cvUrl) : "No CV Uploaded")}</p><p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{profile?.cvUrl ? "Verified & Ready" : "Please upload your resume"}</p></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="file" ref={cvInputRef} className="hidden" accept=".pdf" onChange={handleCVUpload} />
                                        {profile?.cvUrl && <a href={profile.cvUrl} target="_blank"><Button variant="ghost" size="sm" icon={ExternalLink} className="bg-white shadow-sm p-3 rounded-2xl"></Button></a>}
                                        <Button variant="outline" size="sm" icon={Upload} onClick={() => cvInputRef.current?.click()}>{profile?.cvUrl ? "Update" : "Upload"}</Button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </Card>

                    <section className="space-y-6">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase text-xs opacity-40">Recent Applications</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {applications.length > 0 ? applications.map((app) => (
                                <Card key={app.id} noPadding className="group hover:-translate-y-1 transition-all duration-300">
                                    <div className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 bg-gray-50 rounded-[1.2rem] flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                                <Briefcase size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{(app.job as any)?.title || "Job Application"}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(app.createdAt).toLocaleDateString('en-GB')}</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span>ID: {app.id.slice(0, 8)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={app.status === 'accepted' ? 'green' : app.status === 'rejected' ? 'red' : 'yellow'} isDot>{app.status}</Badge>
                                    </div>
                                </Card>
                            )) : <div className="py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100"><p className="text-gray-400 font-bold">Chưa có đơn ứng tuyển nào.</p></div>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}