"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

export default function GoogleAuthProvider({
    children,
    clientId
}: {
    children: React.ReactNode;
    clientId: string;
}) {
    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
