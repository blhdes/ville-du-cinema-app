import React from 'react';

interface LogoProps {
    size?: number;
    className?: string;
}

export default function Logo({ size = 80, className = '' }: LogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Village du Cinéma logo"
        >
            {/* Triple offset squares (RGB layers) */}
            <rect x="46" y="46" width="108" height="108" fill="#E63946"/>
            <rect x="43" y="43" width="108" height="108" fill="#2E86AB"/>
            <rect x="40" y="40" width="108" height="108" fill="#FFD600"/>

            {/* Main square */}
            <rect x="37" y="37" width="108" height="108" fill="white" stroke="black" strokeWidth="5"/>

            {/* V */}
            <text x="91" y="120" fontFamily="serif" fontSize="72" fontWeight="900" textAnchor="middle" fill="black">V</text>
        </svg>
    );
}
