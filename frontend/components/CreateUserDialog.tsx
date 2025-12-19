"use client";

import { useState } from "react";
import { X, UserPlus, Mail, User, Shield, Lock } from "lucide-react";
import { UserService } from "@/services/userService";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";

interface CreateUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateUserDialog({ isOpen, onClose, onSuccess }: CreateUserDialogProps) {
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        password: "Password123@", // Default password
        role: "candidate"
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            await UserService.createUser(formData);
            onSuccess();
            setFormData({ email: "", name: "", password: "Password123@", role: "candidate" });
        } catch (error) {
            console.error("Failed to create user", error);
            alert("Failed to create user. Email might already exist.");
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = [
        { value: "candidate", label: "Candidate", icon: User },
        { value: "admin", label: "Administrator", icon: Shield },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-gray-100">
                
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
                            <UserPlus className="text-white" size={20} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Add New User</h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-8 space-y-6">
                    <Input 
                        label="Full Name"
                        icon={User}
                        placeholder="Nguyễn Văn A"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <Input 
                        label="Email Address"
                        icon={Mail}
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />

                    <Input 
                        label="Password"
                        icon={Lock}
                        type="text" // Shown for admin creation convenience
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />

                    <Dropdown 
                        label="Account Role"
                        icon={Shield}
                        options={roleOptions}
                        value={formData.role}
                        onChange={(val) => setFormData({ ...formData, role: val })}
                    />
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        className="border-none shadow-none bg-transparent hover:bg-gray-200"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        isLoading={loading}
                        className="px-8"
                    >
                        Create User
                    </Button>
                </div>
            </div>
        </div>
    );
}