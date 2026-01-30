'use client';

import React from 'react';

export default function AnimatedWelcomeLogo() {
    return (
        <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Yellow square (background) */}
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-[#FFD600] border-4 border-black"></div>

            {/* Black square (foreground) with animated red line */}
            <div className="absolute top-0 left-0 w-28 h-28 bg-black border-4 border-black overflow-hidden">
                {/* Animated red line */}
                <div className="absolute left-0 right-0 h-1 bg-[#E63946] animate-slideNotification"></div>
            </div>
        </div>
    );
}
