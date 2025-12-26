"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "@/models/User";
import { AuthService } from "@/services/auth";

interface AuthContextType {
    user: UserProfile | null;
    profile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, refreshProfile: async () => { }, logout: () => { } });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        const token = AuthService.getToken();
        if (!token) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            const userProfile = await AuthService.getCurrentUser();
            if (userProfile) {
                setUser(userProfile);
                setProfile(userProfile);
            } else {
                // Token invalid or expired
                AuthService.logout();
                setUser(null);
                setProfile(null);
            }
        } catch (error) {
            console.error("Failed to load profile", error);
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        AuthService.logout();
        setUser(null);
        setProfile(null);
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
