import { Plus, X } from "lucide-react";
import { useState } from "react";

interface StringListEditorProps {
  label: string;
  items: string[];
  onChange: (newItems: string[]) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function StringListEditor({
  label,
  items,
  onChange,
  placeholder = "Thêm mục...",
  icon,
}: StringListEditorProps) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (!newItem.trim()) return;
    onChange([...items, newItem]);
    setNewItem("");
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
        {icon && <span className="text-gray-500">{icon}</span>}
        <label>{label}</label>
        <span className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg group border border-gray-100"
          >
            <span className="flex-1 text-sm text-gray-800 wrap-break-word">
              {item}
            </span>
            <button
              onClick={() => handleRemove(idx)}
              className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          disabled={!newItem.trim()}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
