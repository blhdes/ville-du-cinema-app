'use client';

import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorNotificationProps {
    message: string;
    onClose: () => void;
    autoHideDuration?: number;
}

export default function ErrorNotification({
    message,
    onClose,
    autoHideDuration = 5000
}: ErrorNotificationProps) {
    useEffect(() => {
        if (autoHideDuration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, autoHideDuration);
            return () => clearTimeout(timer);
        }
    }, [autoHideDuration, onClose]);

    return (
        <div className="bg-[#E63946] border-4 border-black p-4 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-[slideDown_0.3s_ease-out]">
            <div className="flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={20} color="white" />
                <div className="flex-1">
                    <p className="text-white font-serif font-bold text-sm">
                        {message}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="shrink-0 text-white hover:text-[#FFD600] transition-colors p-1"
                    aria-label="Close notification"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
