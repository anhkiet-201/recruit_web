"use client";

import { JobPositionEditor } from "./JobPositionEditor";
import {
  RecruitmentPost,
  JobPosition,
  RecruitmentStatus,
  EmploymentType,
  SalaryType,
  ShiftSelection,
  SalaryConfig,
} from "@/models/Recruitment";
import {
  Trash2,
  Briefcase,
  DollarSign,
  FileText,
  Edit2,
  Sparkles,
  Copy,
} from "lucide-react";
import { useState } from "react";
import AiPostModal from "./AiPostModal";

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9);
};

const getShiftSelectionLabel = (selection: ShiftSelection) => {
  switch (selection) {
    case ShiftSelection.Flexible:
      return "Được chọn ca";
    case ShiftSelection.DayShiftOnly:
      return "Chỉ ca ngày";
    case ShiftSelection.NightShiftOnly:
      return "Chỉ ca đêm";
    case ShiftSelection.OfficeHoursOvertime:
      return "Hành chính tăng ca";
    case ShiftSelection.ArrangedByHR:
      return "Nhân sự sắp xếp";
    case ShiftSelection.RotatingShift:
      return "Xoay ca";
    default:
      return selection;
  }
};

const getSalaryLabel = (sal: SalaryConfig) => {
  if (sal.type === SalaryType.Monthly) {
    return `${sal.amount}`;
  }
  if (sal.type === SalaryType.Shift) {
    const parts = [
      `Ca ${sal.isNightShift ? "Đêm" : "Ngày"}: ${sal.standardRate}`,
    ];
    if (sal.sundayRate) parts.push(`CN: ${sal.sundayRate}`);
    if (sal.holidayRate) parts.push(`Lễ: ${sal.holidayRate}`);
    return parts.join(" - ");
  }
  if (sal.type === SalaryType.Overtime) {
    const dayParts = [`Ngày: ${sal.dayShiftOvertime?.standardRate || "?"}`];
    if (sal.dayShiftOvertime?.sundayRate)
      dayParts.push(`CN: ${sal.dayShiftOvertime.sundayRate}`);
    if (sal.dayShiftOvertime?.holidayRate)
      dayParts.push(`Lễ: ${sal.dayShiftOvertime.holidayRate}`);

    const nightParts = [`Đêm: ${sal.nightShiftOvertime?.standardRate || "?"}`];
    if (sal.nightShiftOvertime?.sundayRate)
      nightParts.push(`CN: ${sal.nightShiftOvertime.sundayRate}`);
    if (sal.nightShiftOvertime?.holidayRate)
      nightParts.push(`Lễ: ${sal.nightShiftOvertime.holidayRate}`);

    return `Tăng ca: ${dayParts.join(", ")} | ${nightParts.join(", ")}`;
  }
  return "";
};

const getEmploymentTypeLabel = (type: EmploymentType) => {
  switch (type) {
    case EmploymentType.FullTime:
      return "Toàn thời gian";
    case EmploymentType.Temporary:
      return "Thời vụ";
    case EmploymentType.Seasonal:
      return "Mùa vụ";
    default:
      return type;
  }
};

interface RecruitmentDetailProps {
  post: RecruitmentPost | null;
  onUpdate: (id: string, updates: Partial<RecruitmentPost>) => void;
  onDelete: (id: string) => void;
}

export function RecruitmentDetail({
  post,
  onUpdate,
  onDelete,
}: RecruitmentDetailProps) {
  // State for Full Screen Editor
  const [editingPositionIndex, setEditingPositionIndex] = useState<
    number | null
  >(null);

  const [aiModalPositionIndex, setAiModalPositionIndex] = useState<
    number | null
  >(null);

  if (!post) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
        <FileText size={48} className="mb-4 opacity-20" />
        <p>Chọn một bài đăng để xem chi tiết</p>
      </div>
    );
  }

  const handleAddPosition = () => {
    if (!post) return;
    const newPosition: JobPosition = {
      id: generateId(),
      title: "Vị trí mới",
      status: RecruitmentStatus.Recruiting,
      employmentTypes: [EmploymentType.FullTime],
      benefits: [],
      requirements: [],
      otherRequirements: [],
      managers: [],
      shifts: [],
      salaryPackages: [],
      environment: [],
      notes: [],
      shiftSelections: [],
    };
    const newPositions = [...post.positions, newPosition];
    onUpdate(post.id, { positions: newPositions });
    // Automatically open editor for the new position
    setEditingPositionIndex(newPositions.length - 1);
  };

  const handleDeletePosition = (index: number) => {
    if (!post) return;
    const updatedPositions = post.positions.filter((_, i) => i !== index);
    onUpdate(post.id, { positions: updatedPositions });
  };

  const handleSavePosition = (updatedPosition: JobPosition) => {
    if (!post || editingPositionIndex === null) return;
    const updatedPositions = [...post.positions];
    updatedPositions[editingPositionIndex] = updatedPosition;
    onUpdate(post.id, { positions: updatedPositions });
    setEditingPositionIndex(null);
  };

  const handleClonePosition = (index: number) => {
    if (!post) return;
    const positionToClone = post.positions[index];
    const newPosition: JobPosition = {
      ...positionToClone,
      id: generateId(),
      title: `${positionToClone.title} (Copy)`,
    };

    const newPositions = [...post.positions];
    newPositions.splice(index + 1, 0, newPosition);
    onUpdate(post.id, { positions: newPositions });
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* FULL SCREEN EDITOR OVERLAY */}
      {editingPositionIndex !== null &&
        post &&
        post.positions[editingPositionIndex] && (
          <JobPositionEditor
            position={post.positions[editingPositionIndex]}
            onSave={handleSavePosition}
            onCancel={() => setEditingPositionIndex(null)}
          />
        )}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="w-full mr-4">
          <input
            className="text-xl font-bold text-gray-800 focus:outline-none focus:ring-0 w-full placeholder-gray-300"
            value={post.companyName}
            onChange={(e) => onUpdate(post.id, { companyName: e.target.value })}
            placeholder="Tên công ty"
          />
          <input
            className="text-sm text-gray-500 focus:outline-none focus:ring-0 w-full mt-1 placeholder-gray-300"
            value={post.address}
            onChange={(e) => onUpdate(post.id, { address: e.target.value })}
            placeholder="Địa chỉ"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onDelete(post.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Job Positions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={14} /> Vị trí tuyển dụng
            </h3>
            <button
              onClick={handleAddPosition}
              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold hover:bg-blue-100 transition"
            >
              + Thêm vị trí
            </button>
          </div>

          {post.positions.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">Chưa có vị trí nào.</p>
            </div>
          ) : (
            post.positions.map((pos, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors shadow-sm group"
              >
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-800 leading-tight mb-1">
                      {pos.title || "Vị trí chưa đặt tên"}
                    </h4>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-md font-bold ${
                        pos.status === RecruitmentStatus.Recruiting
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {pos.status}
                    </span>
                    {pos.employmentTypes?.map((type, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-md font-bold bg-blue-100 text-blue-700 ml-2"
                      >
                        {getEmploymentTypeLabel(type)}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingPositionIndex(idx)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={18} />
                    </button>

                    {/* Thê nút tạo Job posting bằng gemini ở đây. thông tin được lấy từ recruitment */}
                    <button
                      onClick={() => setAiModalPositionIndex(idx)}
                      className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition"
                      title="AI Generate Post"
                    >
                      <Sparkles size={18} className="fill-violet-600" />
                    </button>

                    {/* Thêm nút Clone ở đây */}
                    <button
                      onClick={() => handleClonePosition(idx)}
                      className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                      title="Nhân bản vị trí"
                    >
                      <Copy size={18} />
                    </button>

                    <button
                      onClick={() => handleDeletePosition(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Xóa vị trí"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Salary Config Preview */}
                <div className="flex gap-4 mb-3">
                  {pos.salaryPackages.map((sal, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                    >
                      <DollarSign size={12} />
                      <span>{getSalaryLabel(sal)}</span>
                    </div>
                  ))}
                </div>

                {/* Managers */}
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-bold">Quản lý:</span>{" "}
                  {pos.managers.length > 0
                    ? pos.managers
                        .map((m) => `${m.name} (${m.phoneNumber})`)
                        .join(", ")
                    : "Chưa có"}
                </div>

                {/* Description
                {pos.descriptionText && (
                  <div className="mb-4 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap border border-gray-100">
                    {pos.descriptionText}
                  </div>
                )} */}

                {/* Grid for Detailed Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shift Selections */}
                  {pos.shiftSelections && pos.shiftSelections.length > 0 && (
                    <div className="md:col-span-2">
                      <h5 className="text-xs font-bold text-purle-600 uppercase mb-1">
                        Quyền chọn ca
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {pos.shiftSelections.map((sel, i) => (
                          <span
                            key={i}
                            className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 font-medium"
                          >
                            {getShiftSelectionLabel(sel)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shifts */}
                  {pos.shifts.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 uppercase mb-1">
                        Ca làm việc
                      </h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {pos.shifts.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-medium">• {s.name}:</span>
                            <span>
                              {s.startTime} - {s.endTime}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Benefits */}
                  {pos.benefits.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-blue-600 uppercase mb-1">
                        Phúc lợi
                      </h5>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {pos.benefits.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Requirements */}
                  {pos.requirements.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-red-600 uppercase mb-1">
                        Yêu cầu
                      </h5>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {pos.requirements.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Other Requirements */}
                  {pos.otherRequirements.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-orange-600 uppercase mb-1">
                        Yêu cầu khác
                      </h5>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {pos.otherRequirements.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Environment */}
                  {pos.environment.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-teal-600 uppercase mb-1">
                        Môi trường / Tiện ích
                      </h5>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {pos.environment.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Notes */}
                  {pos.notes.length > 0 && (
                    <div className="md:col-span-2">
                      <h5 className="text-xs font-bold text-gray-500 uppercase mb-1">
                        Ghi chú nội bộ
                      </h5>
                      <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-100">
                        <ul className="list-disc list-inside">
                          {pos.notes.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Post Modal */}
      {aiModalPositionIndex !== null && (
        <AiPostModal
          isOpen={aiModalPositionIndex !== null}
          onClose={() => setAiModalPositionIndex(null)}
          postId={post.id}
          positionId={post.positions[aiModalPositionIndex]?.id || ""}
          positionTitle={post.positions[aiModalPositionIndex]?.title || ""}
        />
      )}
    </div>
  );
}
