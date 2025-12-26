"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ApplicationService } from "@/services/applicationService";
import { UserService } from "@/services/userService";
import { Application } from "@/models/User";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Wrench,
  FileText,
  Clock,
  ChevronRight,
  Edit2,
  Save,
  X,
  Upload,
  ExternalLink,
  CheckCircle,
  Briefcase,
  RefreshCw,
  AlertCircle,
  Camera,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import EmployerDashboard from "@/components/EmployerDashboard";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  const cvInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    education: "",
    skills: "",
  });

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else {
        ApplicationService.getMyApplications().then(setApplications);
        if (profile) {
          setFormData({
            name: profile.name || "",
            phone: profile.phone || "",
            address: profile.address || "",
            education: profile.education || "",
            skills: profile.skills || "",
          });

          if (profile.role === "candidate") {
            UserService.getEmployerRequestStatus().then(
              (req: { status: string } | null) => {
                if (req) setRequestStatus(req.status);
              }
            );
          }
        }
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
    } catch {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profile?.id) {
      const file = e.target.files[0];

      if (file.type !== "application/pdf") {
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
      } catch {
        alert("Upload failed");
      } finally {
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
      } catch {
        alert("Avatar upload failed");
      } finally {
        setAvatarUploading(false);
        if (avatarInputRef.current) avatarInputRef.current.value = "";
      }
    }
  };

  const getFileName = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    const fullName = parts[parts.length - 1];
    const nameParts = fullName.split("-");
    return nameParts.length > 1 ? nameParts.slice(1).join("-") : fullName;
  };

  if (loading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin text-blue-600" />
      </div>
    );

  if (profile?.role === "employer") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              Employer Dashboard
            </h1>
            <p className="text-slate-500 font-medium">
              Chào mừng trở lại, {profile.name}!
            </p>
          </div>
          <Badge
            variant="blue"
            className="px-4 py-2 uppercase tracking-widest font-black"
          >
            Nhà tuyển dụng
          </Badge>
        </div>
        <EmployerDashboard />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {requestStatus && (
        <div
          className={`mb-8 p-4 rounded-2xl flex items-center justify-between border ${
            requestStatus === "pending"
              ? "bg-yellow-50 border-yellow-100 text-yellow-800"
              : requestStatus === "rejected"
              ? "bg-red-50 border-red-100 text-red-800"
              : "bg-emerald-50 border-emerald-100 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {requestStatus === "pending" ? (
              <Clock size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <div>
              <p className="font-bold text-sm">
                Yêu cầu trở thành Nhà tuyển dụng
              </p>
              <p className="text-xs font-medium opacity-80">
                {requestStatus === "pending"
                  ? "Yêu cầu của bạn đang được admin xem xét."
                  : requestStatus === "rejected"
                  ? "Yêu cầu của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết."
                  : "Yêu cầu của bạn đã được chấp nhận!"}
              </p>
            </div>
          </div>
          <Badge
            variant={
              requestStatus === "pending"
                ? "warning"
                : requestStatus === "rejected"
                ? "danger"
                : "success"
            }
          >
            {requestStatus.toUpperCase()}
          </Badge>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COL - PROFILE CARD (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          <Card
            noPadding
            className="border-none shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] relative overflow-visible bg-white"
          >
            <div className="h-40 bg-linear-to-br from-blue-700 via-blue-600 to-indigo-600 rounded-t-4xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
              <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full blur-2xl"></div>
            </div>
            <div className="px-8 pb-10">
              <div className="relative flex justify-center">
                <div className="-mt-16 h-36 w-36 bg-white rounded-[2.5rem] p-2 shadow-2xl shadow-blue-900/10 group cursor-pointer overflow-hidden relative border-[6px] border-white transition-transform hover:scale-105 duration-500 z-10">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-full w-full bg-slate-50 rounded-4xl flex items-center justify-center text-blue-600 font-black text-5xl overflow-hidden relative"
                  >
                    {profile?.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl}
                        alt="Avatar"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      (profile?.name || user.email)?.[0].toUpperCase()
                    )}
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                      <Camera
                        size={28}
                        className="text-white mb-2 drop-shadow-md"
                      />
                      <span className="text-[10px] text-white font-black uppercase tracking-widest drop-shadow-md">
                        {t("updateAvatar")}
                      </span>
                    </div>
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-20">
                        <RefreshCw
                          size={32}
                          className="animate-spin text-blue-600"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center mt-6 mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {profile?.name || t("member")}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge
                    variant={profile?.role === "admin" ? "purple" : "blue"}
                    className="px-3 py-1 text-[10px] uppercase tracking-widest shadow-sm shadow-blue-200/50"
                  >
                    {profile?.role || t("candidate")}
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Mail size={18} />
                  </div>
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Phone size={18} />
                  </div>
                  <span className="truncate">
                    {profile?.phone || t("noPhone")}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <MapPin size={18} />
                  </div>
                  <span className="truncate">
                    {profile?.address || t("noAddress")}
                  </span>
                </div>
              </div>

              <Button
                variant={isEditing ? "danger" : "outline"}
                className="w-full mt-8 py-6 rounded-2xl font-bold text-sm border-2 hover:bg-slate-50"
                icon={isEditing ? X : Edit2}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? t("cancelEditing") : t("editProfile")}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-4xl p-6 text-center border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={24} />
              </div>
              <p className="text-3xl font-black text-slate-800">
                {applications.length}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {t("applications")}
              </p>
            </div>
            <div className="bg-white rounded-4xl p-6 text-center border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} />
              </div>
              <p className="text-3xl font-black text-slate-800">
                {applications.filter((a) => a.status === "accepted").length}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {t("offers")}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COL - DETAILS (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          <Card
            noPadding
            className="border-none shadow-[0_20px_40px_-5px_rgba(0,0,0,0.05)] overflow-hidden bg-white"
          >
            <div className="flex items-center justify-between p-8 border-b border-slate-50">
              <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                  {t("professionalProfile")}
                </h1>
                <p className="text-slate-400 text-sm font-medium mt-1 pl-5">
                  {t("manageInfo")}
                </p>
              </div>
              {isEditing && (
                <Button
                  size="sm"
                  icon={Save}
                  isLoading={saving}
                  onClick={handleSaveProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                >
                  {t("saveChanges")}
                </Button>
              )}
            </div>

            <div className="p-8 space-y-10">
              {/* Personal Details */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-slate-800 pb-2 border-b border-slate-100">
                  <User size={20} className="text-blue-600" />
                  <h3 className="font-bold text-sm uppercase tracking-widest">
                    {t("personalDetails")}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input
                    label={t("fullName")}
                    className={!isEditing ? "font-semibold text-slate-700" : ""}
                    inputClassName={
                      !isEditing
                        ? "!bg-white border-transparent font-black text-lg text-slate-800 shadow-none px-0"
                        : ""
                    }
                    value={isEditing ? formData.name : profile?.name || "N/A"}
                    readOnly={!isEditing}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <Input
                    label={t("phoneNumber")}
                    className={!isEditing ? "font-semibold text-slate-700" : ""}
                    inputClassName={
                      !isEditing
                        ? "!bg-white border-transparent font-black text-lg text-slate-800 shadow-none px-0"
                        : ""
                    }
                    value={isEditing ? formData.phone : profile?.phone || "N/A"}
                    readOnly={!isEditing}
                    helperText={
                      isEditing && (
                        <p className="text-[10px] text-amber-600 font-bold flex gap-1 mt-1">
                          <AlertCircle size={12} /> {t("phoneHelper")}
                        </p>
                      )
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                  <div className="md:col-span-2">
                    <Input
                      label={t("address")}
                      className={
                        !isEditing ? "font-semibold text-slate-700" : ""
                      }
                      inputClassName={
                        !isEditing
                          ? "!bg-white border-transparent font-semibold text-slate-700 shadow-none px-0"
                          : ""
                      }
                      value={
                        isEditing ? formData.address : profile?.address || "N/A"
                      }
                      readOnly={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Education */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-slate-800 pb-2 border-b border-slate-100">
                  <GraduationCap size={20} className="text-blue-600" />
                  <h3 className="font-bold text-sm uppercase tracking-widest">
                    {t("education")}
                  </h3>
                </div>
                {isEditing ? (
                  <Input
                    isTextArea
                    rows={4}
                    value={formData.education}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    placeholder={t("educationPlaceholder")}
                  />
                ) : (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[100px]">
                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {profile?.education || t("noEducation")}
                    </p>
                  </div>
                )}
              </section>

              {/* Skills */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-slate-800 pb-2 border-b border-slate-100">
                  <Wrench size={20} className="text-blue-600" />
                  <h3 className="font-bold text-sm uppercase tracking-widest">
                    {t("skills")}
                  </h3>
                </div>
                {isEditing ? (
                  <Input
                    placeholder={t("skillsPlaceholder")}
                    value={formData.skills}
                    onChange={(e) =>
                      setFormData({ ...formData, skills: e.target.value })
                    }
                    helperText={t("skillsHelper")}
                  />
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {profile?.skills ? (
                      profile.skills.split(",").map((s, i) => (
                        <div
                          key={i}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm"
                        >
                          {s.trim()}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        {t("noSkills")}
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* CV Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-slate-800 pb-2 border-b border-slate-100">
                  <FileText size={20} className="text-blue-600" />
                  <h3 className="font-bold text-sm uppercase tracking-widest">
                    {t("resume")}
                  </h3>
                </div>

                <div className="group relative overflow-hidden rounded-4xl bg-linear-to-r from-slate-50 to-white border border-slate-200 p-1">
                  <div className="relative flex items-center justify-between p-6 z-10">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 bg-white rounded-2xl border border-slate-100 shadow-lg flex items-center justify-center text-red-500">
                        {cvUploading ? (
                          <RefreshCw
                            size={24}
                            className="animate-spin text-blue-600"
                          />
                        ) : (
                          <FileText size={28} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 truncate max-w-[200px] sm:max-w-xs transition-colors group-hover:text-blue-700">
                          {cvUploading
                            ? t("uploading")
                            : profile?.cvUrl
                            ? getFileName(profile.cvUrl)
                            : t("noResume")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              profile?.cvUrl ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          ></span>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {profile?.cvUrl
                              ? t("pdfVerified")
                              : t("missingFile")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="file"
                        ref={cvInputRef}
                        className="hidden"
                        accept=".pdf"
                        onChange={handleCVUpload}
                      />

                      {profile?.cvUrl && (
                        <a href={profile.cvUrl} target="_blank">
                          <Button
                            variant="ghost"
                            size="md"
                            icon={ExternalLink}
                            className="bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-sm h-10 w-10 p-0! rounded-xl"
                          />
                        </a>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        icon={Upload}
                        onClick={() => cvInputRef.current?.click()}
                        className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm rounded-xl"
                      >
                        {profile?.cvUrl ? t("replace") : t("uploadCloud")}
                      </Button>
                    </div>
                  </div>
                  {/* Decorator */}
                  <div className="absolute top-0 right-0 h-full w-1/3 bg-linear-to-l from-blue-50/50 to-transparent"></div>
                </div>
              </section>
            </div>
          </Card>

          {/* Applications List */}
          <section className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                {t("recentApplications")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-blue-600 font-bold"
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => router.push("/dashboard/applications")}
              >
                {t("viewAll")}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {applications.length > 0 ? (
                applications.slice(0, 3).map((app) => (
                  <Card
                    key={app.id}
                    noPadding
                    className="group hover:-translate-y-1 transition-all duration-300 border-none shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)]"
                  >
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-slate-50 rounded-[1.2rem] flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                          <Briefcase size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">
                            {(app.job as { title?: string })?.title ||
                              t("jobApplication")}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />{" "}
                              {new Date(app.createdAt).toLocaleDateString(
                                "en-GB"
                              )}
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>
                              Ref:{" "}
                              <span className="font-mono text-slate-500">
                                {app.id.slice(0, 8)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          app.status === "accepted"
                            ? "green"
                            : app.status === "rejected"
                            ? "red"
                            : "yellow"
                        }
                        isDot
                        className="px-4 py-2 text-xs"
                      >
                        {app.status}
                      </Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="py-16 text-center bg-white rounded-4xl border-2 border-dashed border-slate-100 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <Briefcase size={24} />
                  </div>
                  <p className="text-slate-500 font-bold">
                    {t("noApplicationsYet")}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/")}
                  >
                    {t("browseJobs")}
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
