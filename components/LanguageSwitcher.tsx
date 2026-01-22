'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
    const currentLocale = useLocale();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
    ];

    const currentLanguage = languages.find(lang => lang.code === currentLocale);

    const handleLanguageChange = (newLocale: string) => {
        if (newLocale === currentLocale) return;

        const newPath = `/${newLocale}`;
        router.push(newPath);
        router.refresh();
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative inline-block">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-sepia-dark hover:text-foreground transition-colors px-3 py-2 border border-foreground/10 hover:border-foreground/30"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Globe size={14} />
                <span className="hidden sm:inline">{currentLanguage?.flag} {currentLanguage?.label}</span>
                <span className="sm:hidden">{currentLanguage?.flag}</span>
                <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            <div
                className={`absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-40 bg-background border-2 border-foreground shadow-lg overflow-hidden transition-all duration-200 origin-top ${
                    isOpen
                        ? 'opacity-100 scale-y-100 pointer-events-auto'
                        : 'opacity-0 scale-y-0 pointer-events-none'
                }`}
                style={{ transformOrigin: 'top' }}
            >
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left px-4 py-3 text-xs font-serif uppercase tracking-widest flex items-center gap-3 transition-colors ${
                            currentLocale === lang.code
                                ? 'bg-foreground text-background font-bold'
                                : 'hover:bg-foreground/5 text-sepia-dark hover:text-foreground'
                        }`}
                        disabled={currentLocale === lang.code}
                    >
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
