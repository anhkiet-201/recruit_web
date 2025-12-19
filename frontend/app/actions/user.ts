'use server';

import { UserService } from "@/services/userService";
import { UserProfile } from "@/models/User";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    return await UserService.getProfile(userId);
}

export async function syncUser(user: { uid: string; email: string; displayName?: string | null; photoURL?: string | null }): Promise<UserProfile> {
    return await UserService.syncUser(user);
}
