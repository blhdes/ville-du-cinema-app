'use client';

import React from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface WatchNotificationProps {
    item: {
        username: string;
        movieTitle: string;
        rating: string;
        link: string;
        pubDate: string;
    };
}

export default function WatchNotification({ item }: WatchNotificationProps) {
    const t = useTranslations('watch');
    const locale = useLocale();

    const formattedDate = new Date(item.pubDate).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
    });

    return (
        <div className="flex items-center justify-between py-1.5 px-3 border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.02] transition-colors group">
            <div className="flex items-baseline gap-1.5 text-xs font-serif text-sepia-dark/70">
                <Eye size={10} className="inline" />
                <span>{item.username}</span>
                <span className="italic">{t('watched')}</span>
                <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(item.movieTitle)}+film`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-accent hover:underline decoration-accent/30 underline-offset-2 transition-colors"
                >
                    {item.movieTitle}
                </a>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-widest text-sepia-dark/40 font-serif">
                    {formattedDate}
                </span>
                <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sepia-dark/40 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                    title={t('viewOnLetterboxd')}
                >
                    <ExternalLink size={10} />
                </a>
            </div>
        </div>
    );
}
