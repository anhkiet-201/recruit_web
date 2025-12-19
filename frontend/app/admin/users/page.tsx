"use client";

import { useEffect, useState } from "react";
import { UserService } from "@/services/userService";
import { UserProfile } from "@/models/User";
import { UserPlus, Trash2, Mail, MapPin, Phone, Search, XCircle } from "lucide-react";
import { useConfirm } from "@/contexts/ConfirmDialogContext";
import CreateUserDialog from "@/components/CreateUserDialog";
import { useAuth } from "@/components/AuthProvider";
import UserDetailsDialog from "@/components/UserDetailsDialog";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

export default function AdminUsersPage() {
    const { confirm } = useConfirm();
    const { profile: myProfile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedUserForView, setSelectedUserForView] = useState<UserProfile | null>(null);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await UserService.getAllUsers();
            setUsers(data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleDeleteUser = async (user: UserProfile) => {
        const ok = await confirm({
            title: "Xóa tài khoản",
            message: `Bạn có chắc chắn muốn xóa "${user.email}"? Thao tác này không thể hoàn tác.`,
            confirmText: "Xóa người dùng",
            isDanger: true
        });
        if (!ok) return;
        try {
            await UserService.deleteUser(user.id);
            setUsers(users.filter(u => u.id !== user.id));
        } catch (e) { alert("Lỗi khi xóa người dùng."); }
    };

    const handleRoleChange = (userId: string, newRole: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        if (selectedUserForView?.id === userId) setSelectedUserForView({ ...selectedUserForView, role: newRole });
    };

    const filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="min-h-[400px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-8 pb-20">
            <CreateUserDialog isOpen={showCreateDialog} onClose={() => setShowCreateDialog(false)} onSuccess={() => { setShowCreateDialog(false); loadUsers(); }} />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-gray-500 font-medium mt-1">Quản lý tài khoản người dùng và quản trị viên</p>
                </div>
                <Button icon={UserPlus} onClick={() => setShowCreateDialog(true)}>Add New User</Button>
            </div>

            <Card noPadding className="border-none shadow-2xl p-4 bg-gray-50/30 flex items-center">
                <div className="w-full md:w-96">
                    <Input icon={Search} placeholder="Tìm theo tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <Card key={user.id} noPadding className="group hover:-translate-y-1.5 transition-all duration-500 cursor-pointer overflow-visible" onClick={() => setSelectedUserForView(user)}>
                        <div className="p-8 pb-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-inner">
                                    {user.name?.[0] || user.email[0].toUpperCase()}
                                </div>
                                {myProfile?.id !== user.id && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }} className="text-gray-300 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                                )}
                            </div>
                            
                            <div className="space-y-1">
                                <h3 className="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{user.name || "Chưa đặt tên"}</h3>
                                <Badge variant={user.role === 'admin' ? "purple" : "green"} isDot>{user.role}</Badge>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-50 space-y-3">
                                <div className="flex items-center text-sm text-gray-500 font-medium gap-3"><Mail size={16} className="text-gray-300" /> <span className="truncate">{user.email}</span></div>
                                {user.phone && <div className="flex items-center text-sm text-gray-500 font-medium gap-3"><Phone size={16} className="text-gray-300" /> {user.phone}</div>}
                                {user.address && <div className="flex items-center text-sm text-gray-500 font-medium gap-3"><MapPin size={16} className="text-gray-300" /> <span className="truncate">{user.address}</span></div>}
                            </div>
                        </div>
                        <div className="px-8 py-4 bg-gray-50/50 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span>Tham gia: {new Date(user.createdAt).toLocaleDateString('en-GB')}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Click to view detail →</span>
                        </div>
                    </Card>
                )) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                        <XCircle size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold">Không tìm thấy người dùng phù hợp.</p>
                    </div>
                )}
            </div>

            <UserDetailsDialog user={selectedUserForView} onClose={() => setSelectedUserForView(null)} onRoleChange={handleRoleChange} />
        </div>
    );
}