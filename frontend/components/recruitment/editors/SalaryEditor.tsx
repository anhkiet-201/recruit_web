import { SalaryConfig, SalaryType, ShiftRate } from "@/models/Recruitment";
import { Trash2, DollarSign } from "lucide-react";
import { useState } from "react";

interface SalaryEditorProps {
  salaryPackages: SalaryConfig[];
  onChange: (salaries: SalaryConfig[]) => void;
}

// Interface to handle form state for all salary types
interface SalaryFormState {
  amount?: string;
  standardRate?: string;
  sundayRate?: string;
  holidayRate?: string;
  isNightShift?: boolean;
  dayShiftOvertime?: ShiftRate;
  nightShiftOvertime?: ShiftRate;
}

export function SalaryEditor({ salaryPackages, onChange }: SalaryEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  // Temporary state for new salary creation
  const [newSalaryType, setNewSalaryType] = useState<SalaryType>(
    SalaryType.Monthly
  );
  const [newSalaryConfig, setNewSalaryConfig] = useState<SalaryFormState>({});

  const handleAddStart = () => {
    setNewSalaryType(SalaryType.Monthly);
    setNewSalaryConfig({});
    setIsAdding(true);
  };

  const handleAddConfirm = () => {
    let salaryToAdd: SalaryConfig;

    if (newSalaryType === SalaryType.Monthly) {
      salaryToAdd = {
        type: SalaryType.Monthly,
        amount: newSalaryConfig.amount || "",
      };
    } else if (newSalaryType === SalaryType.Shift) {
      salaryToAdd = {
        type: SalaryType.Shift,
        standardRate: newSalaryConfig.standardRate || "",
        sundayRate: newSalaryConfig.sundayRate || "",
        holidayRate: newSalaryConfig.holidayRate || "",
        isNightShift: !!newSalaryConfig.isNightShift,
      };
    } else {
      // Overtime
      salaryToAdd = {
        type: SalaryType.Overtime,
        dayShiftOvertime: newSalaryConfig.dayShiftOvertime || {
          standardRate: "",
          sundayRate: "",
          holidayRate: "",
        },
        nightShiftOvertime: newSalaryConfig.nightShiftOvertime || {
          standardRate: "",
          sundayRate: "",
          holidayRate: "",
        },
      };
    }

    onChange([...salaryPackages, salaryToAdd]);
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(salaryPackages.filter((_, i) => i !== index));
  };

  const renderDescription = (sal: SalaryConfig) => {
    if (sal.type === SalaryType.Monthly) {
      return `Lương tháng: ${sal.amount}`;
    }
    if (sal.type === SalaryType.Shift) {
      const parts = [
        `Ca ${sal.isNightShift ? "Đêm" : "Ngày"}: ${sal.standardRate}`,
      ];
      if (sal.sundayRate) parts.push(`CN: ${sal.sundayRate}`);
      if (sal.holidayRate) parts.push(`Lễ: ${sal.holidayRate}`);
      return parts.join(" - ");
    }

    // Overtime
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
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <DollarSign size={16} /> Chế độ lương
        </label>
        {!isAdding && (
          <button
            onClick={handleAddStart}
            className="text-xs text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded"
          >
            + Thêm chế độ lương
          </button>
        )}
      </div>

      <div className="space-y-2">
        {salaryPackages.map((sal, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            <div>
              <div className="font-bold text-gray-800 text-sm">{sal.type}</div>
              <div className="text-xs text-gray-500">
                {renderDescription(sal)}
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
        <div className="bg-gray-50 p-4 rounded-xl border border-blue-200 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">
              Loại lương
            </label>
            <select
              className="w-full text-sm border-gray-300 rounded-lg p-2"
              value={newSalaryType}
              onChange={(e) => setNewSalaryType(e.target.value as SalaryType)}
            >
              <option value={SalaryType.Monthly}>Lương tháng (Cố định)</option>
              <option value={SalaryType.Shift}>Lương theo ca (Thời vụ)</option>
              <option value={SalaryType.Overtime}>
                Lương tăng ca (Overtime)
              </option>
            </select>
          </div>

          {newSalaryType === SalaryType.Monthly && (
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">
                Số tiền
              </label>
              <input
                className="w-full text-sm border-gray-300 rounded-lg p-2"
                placeholder="VD: 10tr"
                onChange={(e) =>
                  setNewSalaryConfig({
                    ...newSalaryConfig,
                    amount: e.target.value,
                  })
                }
              />
            </div>
          )}

          {newSalaryType === SalaryType.Shift && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Lương cơ bản
                  </label>
                  <input
                    className="w-full text-sm border-gray-300 rounded-lg p-2"
                    onChange={(e) =>
                      setNewSalaryConfig({
                        ...newSalaryConfig,
                        standardRate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Lương Chủ Nhật
                  </label>
                  <input
                    className="w-full text-sm border-gray-300 rounded-lg p-2"
                    onChange={(e) =>
                      setNewSalaryConfig({
                        ...newSalaryConfig,
                        sundayRate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="nightShift"
                  onChange={(e) =>
                    setNewSalaryConfig({
                      ...newSalaryConfig,
                      isNightShift: e.target.checked,
                    })
                  }
                />
                <label htmlFor="nightShift" className="text-sm">
                  Là ca đêm?
                </label>
              </div>
            </div>
          )}

          {newSalaryType === SalaryType.Overtime && (
            <div className="space-y-4">
              {/* Day Shift Overtime */}
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <h4 className="text-xs font-bold text-orange-700 uppercase mb-2">
                  Tăng ca Ban Ngày
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Cơ bản
                    </label>
                    <input
                      className="w-full text-sm border-gray-300 rounded-lg p-2"
                      onChange={(e) =>
                        setNewSalaryConfig({
                          ...newSalaryConfig,
                          dayShiftOvertime: {
                            ...newSalaryConfig.dayShiftOvertime,
                            standardRate: e.target.value,
                            sundayRate:
                              newSalaryConfig.dayShiftOvertime?.sundayRate ||
                              "",
                            holidayRate:
                              newSalaryConfig.dayShiftOvertime?.holidayRate ||
                              "",
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Chủ Nhật
                    </label>
                    <input
                      className="w-full text-sm border-gray-300 rounded-lg p-2"
                      onChange={(e) =>
                        setNewSalaryConfig({
                          ...newSalaryConfig,
                          dayShiftOvertime: {
                            ...newSalaryConfig.dayShiftOvertime,
                            sundayRate: e.target.value,
                            standardRate:
                              newSalaryConfig.dayShiftOvertime?.standardRate ||
                              "",
                            holidayRate:
                              newSalaryConfig.dayShiftOvertime?.holidayRate ||
                              "",
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Night Shift Overtime */}
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2">
                  Tăng ca Ban Đêm
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Cơ bản
                    </label>
                    <input
                      className="w-full text-sm border-gray-300 rounded-lg p-2"
                      onChange={(e) =>
                        setNewSalaryConfig({
                          ...newSalaryConfig,
                          nightShiftOvertime: {
                            ...newSalaryConfig.nightShiftOvertime,
                            standardRate: e.target.value,
                            sundayRate:
                              newSalaryConfig.nightShiftOvertime?.sundayRate ||
                              "",
                            holidayRate:
                              newSalaryConfig.nightShiftOvertime?.holidayRate ||
                              "",
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      Chủ Nhật
                    </label>
                    <input
                      className="w-full text-sm border-gray-300 rounded-lg p-2"
                      onChange={(e) =>
                        setNewSalaryConfig({
                          ...newSalaryConfig,
                          nightShiftOvertime: {
                            ...newSalaryConfig.nightShiftOvertime,
                            sundayRate: e.target.value,
                            standardRate:
                              newSalaryConfig.nightShiftOvertime
                                ?.standardRate || "",
                            holidayRate:
                              newSalaryConfig.nightShiftOvertime?.holidayRate ||
                              "",
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
            <button
              onClick={() => setIsAdding(false)}
              className="text-gray-500 text-xs font-bold px-3 py-2 hover:bg-gray-200 rounded-lg"
            >
              Hủy
            </button>
            <button
              onClick={handleAddConfirm}
              className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700"
            >
              Thêm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
