import {
  JobPosition,
  RecruitmentStatus,
  EmploymentType,
} from "@/models/Recruitment";
import { ArrowLeft, Briefcase, FileText } from "lucide-react";
import { useState } from "react";
import { StringListEditor } from "./editors/StringListEditor";
import { ManagerEditor } from "./editors/ManagerEditor";
import { ShiftEditor } from "./editors/ShiftEditor";
import { SalaryEditor } from "./editors/SalaryEditor";
import { ShiftSelectionEditor } from "./editors/ShiftSelectionEditor";

interface JobPositionEditorProps {
  position: JobPosition;
  onSave: (updatedPosition: JobPosition) => void;
  onCancel: () => void;
}

export function JobPositionEditor({
  position,
  onSave,
  onCancel,
}: JobPositionEditorProps) {
  const [editedPos, setEditedPos] = useState<JobPosition>({ ...position });

  const handleChange = (changes: Partial<JobPosition>) => {
    setEditedPos((prev) => ({ ...prev, ...changes }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
      {/* Header - Note App Style */}
      <div className="h-14 px-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="font-semibold text-gray-800">Chỉnh sửa Vị trí</span>
        <button
          onClick={() => onSave(editedPos)}
          className="text-blue-600 font-bold text-sm px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-full transition"
        >
          Lưu
        </button>
      </div>

      {/* Scrollable Content - "Paper" feel */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto px-5 py-6 space-y-8">
          {/* 1. Title & Status (The "Header" of the note) */}
          <div className="space-y-4">
            <input
              className="w-full text-3xl font-bold placeholder-gray-300 border-none focus:ring-0 p-0 text-gray-800"
              placeholder="Tên vị trí (VD: Nhân viên kinh doanh)"
              value={editedPos.title}
              onChange={(e) => handleChange({ title: e.target.value })}
            />

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">
                Hình thức:
              </span>
              <div className="bg-gray-100 p-1 rounded-lg inline-flex flex-wrap gap-1">
                {[
                  { value: EmploymentType.FullTime, label: "Toàn thời gian" },
                  { value: EmploymentType.Temporary, label: "Thời vụ" },
                  { value: EmploymentType.Seasonal, label: "Mùa vụ" },
                ].map((type) => {
                  const isSelected = editedPos.employmentTypes?.includes(
                    type.value
                  );
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        const current = editedPos.employmentTypes || [];
                        const next = isSelected
                          ? current.filter((t) => t !== type.value)
                          : [...current, type.value];
                        handleChange({ employmentTypes: next });
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                        isSelected
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">
                Trạng thái:
              </span>
              <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                <button
                  onClick={() =>
                    handleChange({ status: RecruitmentStatus.Recruiting })
                  }
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    editedPos.status === RecruitmentStatus.Recruiting
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ĐANG TUYỂN
                </button>
                <button
                  onClick={() =>
                    handleChange({ status: RecruitmentStatus.Stopped })
                  }
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    editedPos.status === RecruitmentStatus.Stopped
                      ? "bg-white text-red-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ĐÃ NGƯNG
                </button>
              </div>
            </div>
          </div>

          {/* <hr className="border-gray-100" /> */}

          {/* 2. Description */}
          {/* <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider block">
              Mô tả chi tiết
            </label>
            <textarea
              className="w-full min-h-[120px] text-base leading-relaxed border-none focus:ring-0 p-0 text-gray-700 resize-none bg-transparent"
              placeholder="Nhập mô tả chi tiết về vị trí công việc..."
              value={editedPos.descriptionText || ""}
              onChange={(e) =>
                handleChange({ descriptionText: e.target.value })
              }
            />
          </div> */}

          <hr className="border-gray-100" />

          {/* 3. String Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <StringListEditor
              label="Phúc lợi"
              items={editedPos.benefits}
              onChange={(benefits) => handleChange({ benefits })}
              icon={<Briefcase size={16} />}
              placeholder="Thêm phúc lợi..."
            />
            <StringListEditor
              label="Yêu cầu"
              items={editedPos.requirements}
              onChange={(requirements) => handleChange({ requirements })}
              icon={<FileText size={16} />}
              placeholder="Thêm yêu cầu..."
            />
            <StringListEditor
              label="Yêu cầu khác"
              items={editedPos.otherRequirements}
              onChange={(otherRequirements) =>
                handleChange({ otherRequirements })
              }
              placeholder="Thêm thông tin khác..."
            />
            <StringListEditor
              label="Môi trường / Tiện ích"
              items={editedPos.environment}
              onChange={(environment) => handleChange({ environment })}
              placeholder="Thêm mô tả môi trường..."
            />
            <StringListEditor
              label="Ghi chú nội bộ"
              items={editedPos.notes}
              onChange={(notes) => handleChange({ notes })}
              placeholder="Thêm ghi chú..."
            />
          </div>

          <hr className="border-gray-100" />

          {/* 4. Complex Data */}
          <div className="space-y-8">
            <SalaryEditor
              salaryPackages={editedPos.salaryPackages}
              onChange={(salaryPackages) => handleChange({ salaryPackages })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ManagerEditor
                managers={editedPos.managers}
                onChange={(managers) => handleChange({ managers })}
              />
              <ShiftEditor
                shifts={editedPos.shifts}
                onChange={(shifts) => handleChange({ shifts })}
              />
              <ShiftSelectionEditor
                selections={editedPos.shiftSelections || []}
                onChange={(shiftSelections) =>
                  handleChange({ shiftSelections })
                }
              />
            </div>
          </div>

          {/* Bottom Spacer for Mobile Keyboard */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
