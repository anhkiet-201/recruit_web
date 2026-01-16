import { ShiftSelection } from "@/models/Recruitment";
import { Check, Clock } from "lucide-react";

interface ShiftSelectionEditorProps {
  selections: ShiftSelection[];
  onChange: (selections: ShiftSelection[]) => void;
}

const SHIFT_OPTIONS = [
  { value: ShiftSelection.Flexible, label: "Được chọn ca" },
  { value: ShiftSelection.DayShiftOnly, label: "Chỉ ca ngày" },
  { value: ShiftSelection.NightShiftOnly, label: "Chỉ ca đêm" },
  { value: ShiftSelection.OfficeHoursOvertime, label: "Hành chính tăng ca" },
  { value: ShiftSelection.ArrangedByHR, label: "Nhân sự sắp xếp" },
  { value: ShiftSelection.RotatingShift, label: "Xoay ca" },
];

export function ShiftSelectionEditor({
  selections,
  onChange,
}: ShiftSelectionEditorProps) {
  const toggleSelection = (value: ShiftSelection) => {
    if (selections.includes(value)) {
      onChange(selections.filter((s) => s !== value));
    } else {
      onChange([...selections, value]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={16} className="text-purple-600" />
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Quyền chọn ca
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SHIFT_OPTIONS.map((option) => {
          const isSelected = selections.includes(option.value);
          return (
            <button
              key={option.value}
              onClick={() => toggleSelection(option.value)}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                isSelected
                  ? "bg-purple-50 border-purple-200 text-purple-700 shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              {isSelected && <Check size={16} className="text-purple-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
