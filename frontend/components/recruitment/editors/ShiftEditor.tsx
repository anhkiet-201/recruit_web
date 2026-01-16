import { WorkShift } from "@/models/Recruitment";
import { Trash2, Clock } from "lucide-react";
import { useState } from "react";

interface ShiftEditorProps {
  shifts: WorkShift[];
  onChange: (shifts: WorkShift[]) => void;
}

export function ShiftEditor({ shifts, onChange }: ShiftEditorProps) {
  const [newShift, setNewShift] = useState<WorkShift>({
    name: "",
    startTime: "",
    endTime: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newShift.name || !newShift.startTime || !newShift.endTime) return;
    onChange([...shifts, newShift]);
    setNewShift({ name: "", startTime: "", endTime: "" });
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(shifts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Clock size={16} /> Ca làm việc
        </label>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-xs text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded"
          >
            + Thêm ca
          </button>
        )}
      </div>

      <div className="space-y-2">
        {shifts.map((shift, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            <div>
              <div className="font-bold text-gray-800 text-sm">
                {shift.name}
              </div>
              <div className="text-xs text-gray-500">
                {shift.startTime} - {shift.endTime}
              </div>
            </div>
            <button
              onClick={() => handleRemove(idx)}
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-3 rounded-xl border border-blue-200 space-y-2 animate-in fade-in slide-in-from-top-2">
          <input
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
            placeholder="Shift Name (e.g. Ca 1)"
            value={newShift.name}
            onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              type="time"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
              value={newShift.startTime}
              onChange={(e) =>
                setNewShift({ ...newShift, startTime: e.target.value })
              }
            />
            <span className="self-center text-gray-400">-</span>
            <input
              type="time"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
              value={newShift.endTime}
              onChange={(e) =>
                setNewShift({ ...newShift, endTime: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="text-gray-500 text-xs font-bold px-3 py-2 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={
                !newShift.name || !newShift.startTime || !newShift.endTime
              }
              className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add Shift
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
