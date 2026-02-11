'use client';

import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessToastProps {
    message: string;
    onClose: () => void;
    autoHideDuration?: number;
}

export default function SuccessToast({
    message,
    onClose,
    autoHideDuration = 3000
}: SuccessToastProps) {
    useEffect(() => {
        if (autoHideDuration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, autoHideDuration);
            return () => clearTimeout(timer);
        }
    }, [autoHideDuration, onClose]);

    return (
        <div className="fixed bottom-6 right-6 z-50 bg-black border-4 border-[#FFD600] p-4 shadow-[6px_6px_0px_0px_rgba(255,214,0,1)] animate-[slideUp_0.3s_ease-out]">
            <div className="flex items-start gap-3">
                <CheckCircle className="shrink-0 mt-0.5 text-[#FFD600]" size={20} />
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
