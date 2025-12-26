"use client";

import { useState, useEffect } from "react";
import { UserService } from "@/services/userService";
import { EmployerRequest } from "@/models/User";
import Button from "@/components/ui/Button";
import {
  Check,
  X,
  Phone,
  MapPin,
  Calendar,
  User as UserIcon,
  RotateCcw,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { getRequestStatusColor } from "@/utils/jobUtils";
import Image from "next/image";

export default function EmployerRequestsPage() {
  const [requests, setRequests] = useState<EmployerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await UserService.getAllEmployerRequests();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch employer requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (
    id: string,
    status: "approved" | "rejected" | "pending"
  ) => {
    try {
      await UserService.handleEmployerRequest(id, status);
      fetchRequests();
    } catch {
      alert("Action failed");
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Employer Requests
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage users who want to become employers.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                User
              </th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Contact
              </th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Request Date
              </th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-gray-400">
                      Loading requests...
                    </p>
                  </div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-20 text-center text-gray-400 font-bold"
                >
                  No pending requests found.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={request.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black border border-blue-100 overflow-hidden">
                        {request.user?.avatarUrl ? (
                          <Image
                            src={request.user.avatarUrl}
                            alt={request.user.name || "User"}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          request.user?.name?.charAt(0) || (
                            <UserIcon size={18} />
                          )
                        )}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 leading-tight">
                          {request.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400 font-bold mt-0.5">
                          {request.user?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Phone size={12} className="text-gray-400" />
                        {request.user?.phone || "N/A"}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <MapPin size={12} className="text-gray-400" />
                        {request.user?.address || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(request.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={getRequestStatusColor(request.status)}>
                      {request.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {request.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-100 hover:bg-red-50 p-2 rounded-xl"
                          title="Reject Request"
                          onClick={() => handleAction(request.id, "rejected")}
                        >
                          <X size={18} />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded-xl shadow-lg shadow-emerald-100"
                          title="Approve Request"
                          onClick={() => handleAction(request.id, "approved")}
                        >
                          <Check size={18} />
                        </Button>
                      </div>
                    )}
                    {request.status === "approved" && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-orange-50/50 text-orange-600 border-orange-200 hover:bg-orange-600 hover:text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                          onClick={() => handleAction(request.id, "pending")}
                        >
                          <RotateCcw size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Thu hồi quyền
                          </span>
                        </Button>
                      </div>
                    )}
                    {request.status === "rejected" && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-2"
                          onClick={() => handleAction(request.id, "pending")}
                        >
                          <RotateCcw size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Xem xét lại
                          </span>
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
