'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const currentLocale = useLocale();
    const router = useRouter();

    const languages = [
        { code: 'fr', label: 'FR', fullName: 'Français' },
        { code: 'en', label: 'EN', fullName: 'English' },
        { code: 'es', label: 'ES', fullName: 'Español' },
    ];

    const handleLanguageChange = (newLocale: string) => {
        if (newLocale === currentLocale) return;

        // Force a clean navigation to the new locale root
        const newPath = `/${newLocale}`;
        router.push(newPath);
        router.refresh();
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
                            currentLocale === lang.code
                                ? 'border-foreground bg-foreground text-background font-bold'
                                : 'border-foreground/20 text-sepia-dark hover:border-foreground hover:text-foreground'
                        }`}
                        title={lang.fullName}
                        disabled={currentLocale === lang.code}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
