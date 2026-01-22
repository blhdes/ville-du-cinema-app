'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const languages = [
        { code: 'fr', label: 'FR', fullName: 'Français' },
        { code: 'en', label: 'EN', fullName: 'English' },
        { code: 'es', label: 'ES', fullName: 'Español' },
    ];

    const handleLanguageChange = (newLocale: string) => {
        router.push(pathname, { locale: newLocale });
    };

    return (
        <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest">
            <Globe size={12} className="text-sepia-dark" />
            <div className="flex gap-1">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`px-2 py-1 border transition-all ${
                            locale === lang.code
                                ? 'border-foreground bg-foreground text-background font-bold'
                                : 'border-foreground/20 text-sepia-dark hover:border-foreground hover:text-foreground'
                        }`}
                        title={lang.fullName}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
