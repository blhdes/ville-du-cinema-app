'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Header from './Header';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const t = useTranslations('layout');

    return (
        <>
            <Header />

            {/* Content with max-width constraint */}
            <div className="max-w-7xl mx-auto px-6">
                <main className="min-h-[50vh]">{children}</main>
            </div>

            {/* Full-width footer */}
            <footer className="w-full mt-32 py-12 text-center font-serif px-6">
                {/* Full-width border line matching header */}
                <div className="w-full border-t-4 border-foreground mb-8"></div>

                <div className="cahiers-masthead pb-6 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs uppercase tracking-widest mb-8">
                    <div className="flex flex-col gap-2">
                        <span className="font-bold">{t('footer.writing')}</span>
                        <span className="opacity-70">{t('footer.writingCredit')}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="font-bold">{t('footer.edition')}</span>
                        <span className="opacity-70">{t('footer.editionCredit')}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="font-bold">{t('footer.archives')}</span>
                        <span className="opacity-70">{t('footer.archivesVolume')}</span>
                    </div>
                </div>
                </div>
                <p className="text-sm italic opacity-50">{t('footer.founded')}</p>
            </footer>
        </>
    );
}
