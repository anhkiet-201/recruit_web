"use client";

import { LucideIcon, TrendingUp } from "lucide-react";
import { Card } from "./Card";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    trend?: number;
}

export default function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
    return (
        <Card className="hover:-translate-y-1.5 transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
                    <h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tight">{value}</h3>
                    {trend !== undefined && (
                        <div className={`mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-lg w-fit border ${
                            trend >= 0 ? "text-green-600 bg-green-50 border-green-100" : "text-red-600 bg-red-50 border-red-100"
                        }`}>
                            <TrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
                            <span>{trend >= 0 ? "+" : ""}{trend}% Tăng trưởng</span>
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-2xl shadow-lg ${color} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </Card>
    );
}
