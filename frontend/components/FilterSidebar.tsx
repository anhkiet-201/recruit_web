"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Dropdown from "@/components/ui/Dropdown";
import { Filter, Briefcase, Award, GraduationCap, Zap } from "lucide-react";

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const jobType = searchParams.get("jobType") || "all";

  const handleApplyFilters = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newType !== "all") {
      params.set("jobType", newType);
    } else {
      params.delete("jobType");
    }

    router.push(`/jobs?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/jobs");
  };

  const jobTypeOptions = [
    { value: "all", label: "Tất cả loại hình", icon: Briefcase },
    { value: "unskilled", label: "Lao động phổ thông", icon: Zap },
    { value: "professional", label: "Nhân sự cấp cao", icon: Award },
    { value: "skilled", label: "Lao động có bằng cấp", icon: GraduationCap },
  ];

  return (
    <div className="space-y-8 sticky top-32">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
          <Filter size={16} className="text-blue-600" />
          Lọc chi tiết
        </h3>
        {searchParams.get("jobType") && (
          <button
            onClick={clearFilters}
            className="text-[10px] font-black text-red-500 uppercase hover:underline"
          >
            Xóa lọc
          </button>
        )}
      </div>

      <div className="space-y-6">
        <Dropdown
          label="Loại nhân lực"
          options={jobTypeOptions}
          value={jobType}
          onChange={handleApplyFilters}
          icon={Briefcase}
        />
      </div>

      <div className="bg-blue-600 rounded-4xl p-8 text-white relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="relative z-10">
          <h4 className="font-black text-lg mb-2">Đăng ký nhận tin</h4>
          <p className="text-blue-100 text-xs leading-relaxed mb-6 font-medium">
            Chúng tôi sẽ gửi những công việc phù hợp nhất vào email của bạn hàng
            tuần.
          </p>
          <input
            type="email"
            placeholder="email@của-bạn.com"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs placeholder:text-white/40 focus:outline-none focus:bg-white/20 mb-3"
          />
          <button className="w-full py-2.5 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-colors">
            Đăng ký
          </button>
        </div>
      </div>
    </div>
  );
}
