'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const t = useTranslations('layout');
    const locale = useLocale();
    const today = new Date();
    const month = today.toLocaleString(locale, { month: 'long' });
    const year = today.getFullYear();
    const [location, setLocation] = React.useState('Paris, France');

    React.useEffect(() => {
        const fetchLocation = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.city && data.country_name) {
                    setLocation(`${data.city.toUpperCase()}, ${data.country_name.toUpperCase()}`);
                }
            } catch (error) {
                console.error('Location fetch failed:', error);
                // Try fallback via timezone
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (tz && tz.includes('/')) {
                    const city = tz.split('/')[1].replace('_', ' ');
                    setLocation(city.toUpperCase());
                }
            }
        };
        fetchLocation();
    }, []);

    const issueNumber = "001";

    return (
        <>
            {/* Full-width header */}
            <header className="w-full mb-16 text-center py-12 px-6">
                <div className="cahiers-masthead pt-4 pb-6 mb-4">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-serif mb-4 pb-2">
                        <span>{t('header.label')}</span>
                        <span>{t('header.issue', { number: issueNumber, month, year })}</span>
                        <span>{location}</span>
                    </div>
                    {/* Full-width border line */}
                    <div className="w-full border-b border-foreground/10 mb-4"></div>

                    {/* Title with integrated logo */}
                    <h1 className="flex flex-wrap items-center justify-center text-6xl md:text-8xl font-serif font-black tracking-tighter leading-none mb-2">
                        {/* Logo replacing the V - sized to match text height */}
                        <Logo size={72} className="w-[72px] h-[72px] md:w-[96px] md:h-[96px] hover:scale-105 transition-transform duration-200 self-center -mr-2" />
                        <span
                            style={{
                                textShadow: '2px 2px 0 #FFD600, -2px -2px 0 #E63946, 3px -2px 0 #2E86AB'
                            }}
                        >
                            illage{' '}
                        </span>
                        {t('header.titlePreposition') && (
                            <span
                                className="italic font-serif font-normal block md:inline md:-ml-4"
                                style={{
                                    textShadow: '2px 2px 0 #FFD600, -2px -2px 0 #E63946, 3px -2px 0 #2E86AB'
                                }}
                            >
                                {t('header.titlePreposition')}
                            </span>
                        )}{' '}
                        <span
                            style={{
                                textShadow: '2px 2px 0 #FFD600, -2px -2px 0 #E63946, 3px -2px 0 #2E86AB'
                            }}
                        >
                            {t('header.titleWord2')}
                        </span>
                    </h1>

                    {/* Language Switcher - centered on mobile, right-aligned on desktop */}
                    <div className="mt-6 flex justify-center sm:justify-end">
                        <LanguageSwitcher />
                    </div>
                </div>
                <p className="italic text-sepia-dark font-serif text-xl md:text-2xl mt-4 max-w-2xl mx-auto leading-relaxed">
                    {t('tagline')}
                </p>
            </header>

            {/* Content with max-width constraint */}
            <div className="max-w-7xl mx-auto px-6">
                <main className="min-h-[50vh]">{children}</main>
            </div>

            {/* Full-width footer */}
            <footer className="w-full mt-32 py-12 text-center border-t-4 border-foreground font-serif px-6">
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
                <p className="text-sm italic opacity-50">{t('footer.founded')}</p>
            </footer>
        </>
    );
}
