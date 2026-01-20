'use client';

import React from 'react';
import { ExternalLink, Eye } from 'lucide-react';

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
    const formattedDate = new Date(item.pubDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
    });

    return (
        <div className="flex items-center justify-between py-3 px-4 border-b border-foreground/10 last:border-0 hover:bg-foreground/[0.02] transition-colors group">
            <div className="flex items-baseline gap-2 text-sm font-serif">
                <span className="text-sepia-dark"><Eye size={12} className="inline mr-1" /></span>
                <span className="font-bold text-foreground">{item.username}</span>
                <span className="italic text-sepia-dark">a vu</span>
                <span className="font-bold text-foreground uppercase tracking-wide">{item.movieTitle}</span>
                {item.rating && (
                    <span className="text-xs bg-foreground text-background px-1.5 py-0.5 ml-1 tracking-[0.1em]">
                        {item.rating}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-sepia-dark font-serif opacity-60">
                    {formattedDate}
                </span>
                <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sepia-dark hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                    title="Voir sur Letterboxd"
                >
                    <ExternalLink size={12} />
                </a>
            </div>
        </div>
    );
}
