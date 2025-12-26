"use client";

import { useState, useEffect } from "react";
import { UserService } from "@/services/userService";
import { useAuth } from "./AuthProvider";
import Button from "./ui/Button";
import Dialog from "./ui/Dialog";
import { CheckCircle2, AlertCircle, Building2, Send } from "lucide-react";
import Input from "./ui/Input";

interface BecomeEmployerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BecomeEmployerDialog({
  isOpen,
  onClose,
  onSuccess,
}: BecomeEmployerDialogProps) {
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<"info" | "confirm" | "success">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data for missing info
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });

      // If all info is present, skip to confirm
      if (profile.name && profile.phone && profile.address) {
        setStep("confirm");
      } else {
        setStep("info");
      }
    }
  }, [profile, isOpen]);

  const handleUpdateInfo = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await UserService.updateProfile(profile!.id, formData);
      await refreshProfile();
      setStep("confirm");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Cập nhật thông tin thất bại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      await UserService.createEmployerRequest();
      setStep("success");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi yêu cầu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="md">
      {/* Header */}
      <div className="bg-blue-600 p-6 text-white relative overflow-hidden">
        <Building2 className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
        <h3 className="text-xl font-black relative z-10">
          Đăng ký Nhà tuyển dụng
        </h3>
        <p className="text-blue-100 text-sm font-medium relative z-10 mt-1">
          Bắt đầu đăng tin tuyển dụng và tìm kiếm nhân tài.
        </p>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            {error}
          </div>
        )}

        {step === "info" && (
          <div className="space-y-5">
            <p className="text-gray-600 text-sm font-medium mb-2">
              Bạn cần hoàn thiện các thông tin cơ bản trước khi đăng ký làm Nhà
              tuyển dụng.
            </p>
            <Input
              label="Họ và tên"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập họ và tên của bạn"
            />
            <Input
              label="Số điện thoại"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Nhập số điện thoại"
            />
            <Input
              label="Địa chỉ"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Nhập địa chỉ"
            />
            <div className="pt-6 flex gap-4">
              <Button
                variant="ghost"
                className="flex-1 py-3"
                onClick={onClose}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 py-3 shadow-lg shadow-blue-200"
                onClick={handleUpdateInfo}
                isLoading={loading}
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="text-center py-2">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-4xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Send size={36} />
            </div>
            <h4 className="text-xl font-black text-gray-900 mb-3">
              Xác nhận gửi yêu cầu
            </h4>
            <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed max-w-xs mx-auto">
              Hệ thống sẽ gửi thông tin của bạn tới Admin để phê duyệt. Bạn sẽ
              nhận được thông báo khi yêu cầu được chấp nhận.
            </p>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                className="flex-1 py-3"
                onClick={onClose}
                disabled={loading}
              >
                Để sau
              </Button>
              <Button
                className="flex-1 py-3 shadow-lg shadow-blue-200"
                onClick={handleConfirmRequest}
                isLoading={loading}
              >
                Xác nhận gửi
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-2">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-emerald-100 shadow-xl">
              <CheckCircle2 size={40} />
            </div>
            <h4 className="text-xl font-black text-gray-900 mb-3">
              Đã gửi yêu cầu!
            </h4>
            <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed max-w-xs mx-auto">
              Yêu cầu của bạn đang chờ phê duyệt. Bạn có thể theo dõi trạng thái
              tại trang cá nhân.
            </p>
            <Button
              fullWidth
              className="py-3 shadow-lg shadow-blue-200"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
