import { Fragment } from "react";
import { Application } from "@/models/User";
import {
    ChevronDown, Briefcase, Mail, Phone, MapPin,
    FileText, ExternalLink, CheckCircle, Clock, XCircle, HelpCircle
} from "lucide-react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import { formatDate } from "@/lib/utils";

interface ApplicationTableRowProps {
    application: Application;
    isExpanded: boolean;
    onToggle: () => void;
    statusOptions: { value: string; label: string; icon: any }[];
    onStatusChange: (status: any) => void;
}

export default function ApplicationTableRow({
    application: app,
    isExpanded,
    onToggle,
    statusOptions,
    onStatusChange
}: ApplicationTableRowProps) {
    return (
        <Fragment>
            <tr
                onClick={onToggle}
                className={`cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/50'}`}
            >
                <td className="px-8 py-6 text-center">
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} className={isExpanded ? 'text-blue-600' : 'text-gray-400'} />
                    </div>
                </td>
                <td className="px-6 py-6 border-b-none">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-black text-lg overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 text-center">
                            {app.user?.avatarUrl ? (
                                <img src={app.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                app.user?.name?.charAt(0)
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-black text-gray-900 leading-tight">{app.user?.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hồ sơ #ID{app.id.slice(-4).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-6">
                    <p className="text-sm font-bold text-gray-700 line-clamp-1 group-hover:text-blue-600">{app.job?.title}</p>
                </td>
                <td className="px-6 py-6">
                    <p className="text-xs font-bold text-gray-400">{formatDate(app.createdAt)}</p>
                </td>
                <td className="px-6 py-6 border-b-none">
                    <div onClick={e => e.stopPropagation()}>
                        <Dropdown
                            variant="small"
                            value={app.status}
                            options={statusOptions}
                            onChange={(val) => onStatusChange(val)}
                            className="w-full"
                        />
                    </div>
                </td>
                <td className="px-8 py-6 text-right">
                    {app.cvUrl && (
                        <a href={app.cvUrl} target="_blank" onClick={e => e.stopPropagation()}>
                            <Button variant="outline" size="sm" icon={ExternalLink} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">Xem CV</Button>
                        </a>
                    )}
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-blue-50/10 transition-all duration-300">
                    <td colSpan={6} className="px-12 py-10 border-b border-gray-100/50">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 bg-white rounded-[2rem] p-8 border border-blue-100/50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <FileText size={120} />
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Thông tin liên lạc
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email ứng viên</p>
                                                <p className="text-sm font-black text-gray-800 select-all">{app.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                <Phone size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Số điện thoại</p>
                                                <p className="text-sm font-black text-gray-800">{app.user?.phone || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 group border-t border-gray-50 pt-4 mt-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                                <MapPin size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Địa chỉ hiện tại</p>
                                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{app.user?.address || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-6 relative z-10">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Thao tác nhanh
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <a
                                        href={`mailto:${app.user?.email}`}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-blue-600 transition-all border border-transparent hover:shadow-xl hover:shadow-blue-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Mail size={20} className="text-blue-600 group-hover:text-white" />
                                            <span className="font-black text-sm text-gray-700 group-hover:text-white">Gửi Email trực tiếp</span>
                                        </div>
                                        <div className="-rotate-90 text-gray-300 group-hover:text-blue-200">
                                            <ChevronDown size={16} />
                                        </div>
                                    </a>
                                    <a
                                        href={`tel:${app.user?.phone}`}
                                        className={`flex items-center justify-between p-4 bg-gray-50 rounded-2xl group transition-all border border-transparent ${app.user?.phone ? 'hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-100' : 'opacity-50 cursor-not-allowed'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Phone size={20} className="text-emerald-600 group-hover:text-white" />
                                            <span className="font-black text-sm text-gray-700 group-hover:text-white">Gọi điện liên hệ</span>
                                        </div>
                                        <div className="-rotate-90 text-gray-300 group-hover:text-emerald-200">
                                            <ChevronDown size={16} />
                                        </div>
                                    </a>
                                </div>

                                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-6 mt-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                            <Briefcase size={18} />
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-black text-gray-900 mb-1 uppercase tracking-wider">Hợp tác tiếp theo?</h5>
                                            <p className="text-xs text-gray-400 leading-relaxed font-medium">Bạn có muốn mời ứng viên này phỏng vấn cho vị trí <span className="text-indigo-600 font-bold">"{app.job?.title}"</span>?</p>
                                            <div className="flex gap-3 mt-4">
                                                <Button size="sm" className="rounded-xl px-5 shadow-lg shadow-blue-100">Đặt lịch phỏng vấn</Button>
                                                <Button variant="ghost" size="sm" className="rounded-xl text-gray-400 hover:text-gray-600">Lưu vào yêu thích</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </Fragment>
    );
}
