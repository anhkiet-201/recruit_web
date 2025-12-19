"use client";

import { useState } from "react";
import { X, Mail, Phone, MapPin, Shield, Calendar, Fingerprint, RefreshCw } from "lucide-react";
import { UserProfile } from "@/models/User";
import { UserService } from "@/services/userService";
import { useAuth } from "@/components/AuthProvider";

interface UserDetailsDialogProps {
    user: UserProfile | null;
    onClose: () => void;
    onRoleChange: (userId: string, newRole: string) => void;
}

export default function UserDetailsDialog({ user, onClose, onRoleChange }: UserDetailsDialogProps) {
    const [updating, setUpdating] = useState(false);
    const { profile } = useAuth();

    if (!user) return null;

    const isSelf = profile?.id === user.id;

    const handleToggleRole = async () => {
        if (isSelf) return; // Safeguard
        const newRole = user.role === 'admin' ? 'candidate' : 'admin';
        if (!confirm(`Switch this user to ${newRole.toUpperCase()}?`)) return;

        setUpdating(true);
        try {
            await UserService.updateProfile(user.id, { role: newRole });
            onRoleChange(user.id, newRole);
        } catch (error) {
            console.error("Failed to update role", error);
            alert("Failed to change role. You might not have permission.");
        } finally {
            setUpdating(false);
        }
    };

    const infoItems = [
        { icon: Mail, label: "Email Address", value: user.email },
        { icon: Phone, label: "Phone Number", value: user.phone || "Not provided" },
        { icon: MapPin, label: "Address", value: user.address || "Not provided" },
        { 
            icon: Shield, 
            label: "Account Role", 
            value: user.role, 
            isBadge: true,
            action: !isSelf && (
                <button
                    onClick={handleToggleRole}
                    disabled={updating}
                    className="ml-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={10} className={updating ? "animate-spin" : ""} />
                    Change Role
                </button>
            )
        },
        { icon: Calendar, label: "Joined Date", value: new Date(user.createdAt).toLocaleDateString() },
        { icon: Fingerprint, label: "User ID", value: user.id },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 border border-gray-100">
                
                {/* Header with Avatar Background */}
                <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors z-10"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full">
                        <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl border-4 border-white shadow-sm">
                            {user.name?.[0] || user.email[0].toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-16 pb-8 px-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">{user.name || "No Name"}</h2>
                        <p className="text-gray-500 font-medium">User Profile Information</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {infoItems.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 group">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1 border-b border-gray-100 pb-2">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                                        {item.label}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        {item.isBadge ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                item.value === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                {item.value}
                                            </span>
                                        ) : (
                                            <p className="text-gray-700 font-medium break-all">{item.value}</p>
                                        )}
                                        {item.action && item.action}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer - Admin Notice */}
                <div className="px-8 py-4 bg-gray-50 flex items-center justify-center gap-2 text-gray-400 text-xs italic">
                    <Shield size={12} />
                    <span>User details are static. Role can be managed by Administrators.</span>
                </div>
            </div>
        </div>
    );
}