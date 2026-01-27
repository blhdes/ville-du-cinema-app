'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <>
            <Header />

            {/* Content with max-width constraint */}
            <div className="max-w-7xl mx-auto px-6">
                <main className="min-h-[50vh]">{children}</main>
            </div>

            <Footer />
        </>
    );
}
