import { ManagerContact } from "@/models/Recruitment";
import { Trash2, User, Phone } from "lucide-react";
import { useState } from "react";

interface ManagerEditorProps {
  managers: ManagerContact[];
  onChange: (managers: ManagerContact[]) => void;
}

export function ManagerEditor({ managers, onChange }: ManagerEditorProps) {
  const [newManager, setNewManager] = useState<ManagerContact>({
    name: "",
    phoneNumber: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newManager.name || !newManager.phoneNumber) return;
    onChange([...managers, newManager]);
    setNewManager({ name: "", phoneNumber: "" });
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(managers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <User size={16} /> Người quản lý
        </label>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-xs text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded"
          >
            + Thêm quản lý
          </button>
        )}
      </div>

      <div className="space-y-2">
        {managers.map((manager, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            <div>
              <div className="font-bold text-gray-800 text-sm">
                {manager.name}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Phone size={10} /> {manager.phoneNumber}
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
            placeholder="Tên quản lý"
            value={newManager.name}
            onChange={(e) =>
              setNewManager({ ...newManager, name: e.target.value })
            }
          />
          <input
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
            placeholder="Số điện thoại"
            value={newManager.phoneNumber}
            onChange={(e) =>
              setNewManager({ ...newManager, phoneNumber: e.target.value })
            }
          />
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="text-gray-500 text-xs font-bold px-3 py-2 hover:bg-gray-200 rounded-lg"
            >
              Hủy
            </button>
            <button
              onClick={handleAdd}
              disabled={!newManager.name || !newManager.phoneNumber}
              className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Thêm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
