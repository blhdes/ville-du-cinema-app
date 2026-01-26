'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

export default function Header() {
    const t = useTranslations('layout');
    const locale = useLocale();
    const router = useRouter();
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

    const handleHomeClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.push(`/${locale}`);
        router.refresh(); // Force refresh to reset page state
    };

    return (
        <header className="w-full mb-16 text-center py-12 px-6">
            <div className="cahiers-masthead pt-4 pb-6 mb-4">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-serif mb-4 pb-2">
                    <span>{t('header.label')}</span>
                    <span>{t('header.issue', { number: issueNumber, month, year })}</span>
                    <span>{location}</span>
                </div>
                {/* Full-width border line */}
                <div className="w-full border-b border-foreground/10 mb-4"></div>

                <div onClick={handleHomeClick} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tighter leading-none mb-2">
                        <span style={{ textShadow: 'none' }}>
                            <Logo size={90} className="inline-block w-[90px] h-[90px] md:w-[120px] md:h-[120px] align-middle -mt-2 md:-mt-3 -mr-2 hover:scale-105 transition-transform duration-200" />
                        </span>
                        <span style={{ textShadow: '2px 2px 0 #FFD600, -2px -2px 0 #E63946, 3px -2px 0 #2E86AB' }}>
                            illage{' '}
                        </span>
                        {t('header.titlePreposition') && (
                            <span className="italic font-serif font-normal block md:inline md:-ml-4" style={{ textShadow: '2px 2px 0 #FFD600, -2px -2px 0 #E63946, 3px -2px 0 #2E86AB' }}>
                                {t('header.titlePreposition')}
                            </span>
                        )}{' '}
                        <span style={{ textShadow: '2px 2px 0 #FFD600, -2px -2px 0 #E63946, 3px -2px 0 #2E86AB' }}>
                            {t('header.titleWord2')}
                        </span>
                    </h1>
                </div>

                {/* Language Switcher - centered on mobile, right-aligned on desktop */}
                <div className="mt-6 flex justify-center sm:justify-end">
                    <LanguageSwitcher />
                </div>
            </div>
            <p className="italic text-sepia-dark font-serif text-xl md:text-2xl mt-4 max-w-2xl mx-auto leading-relaxed">
                {t('tagline')}
            </p>
        </header>
    );
}
