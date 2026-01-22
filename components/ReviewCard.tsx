'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface ReviewCardProps {
    review: {
        id: string;
        username: string;
        title: string;
        link: string;
        pubDate: string;
        creator: string;
        review: string;
        rating: string;
        movieTitle: string;
    };
}

export default function ReviewCard({ review }: ReviewCardProps) {
    const t = useTranslations('review');
    const locale = useLocale();
    const [isExpanded, setIsExpanded] = useState(false);

    const formattedDate = new Date(review.pubDate).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const hasLongReview = review.review.length > 500;
    const displayReview = isExpanded ? review.review : review.review.slice(0, 500) + (hasLongReview ? '...' : '');

    return (
        <article className="border-b border-foreground/10 pb-12 mb-12 last:border-0 group">
            <header className="mb-6">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(review.movieTitle)}+film`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-3xl md:text-4xl font-serif font-bold leading-tight hover:text-accent transition-colors duration-300 decoration-accent/30 hover:underline underline-offset-8"
                    >
                        {review.movieTitle}
                    </a>
                    {review.rating && (
                        <div className="text-sm font-serif tracking-[0.2em] bg-foreground text-background px-2 py-1 flex-shrink-0">
                            {review.rating}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4 text-xs uppercase tracking-widest font-serif text-sepia-dark">
                    <span>{t('by')} <span className="text-foreground font-bold">{review.username}</span></span>
                    <span className="w-1 h-1 bg-sepia-dark rounded-full"></span>
                    <span>{formattedDate}</span>
                </div>
            </header>

            <div className="relative">
                <div
                    className="prose prose-stone max-w-none text-foreground/90 font-body text-lg leading-relaxed first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1"
                    dangerouslySetInnerHTML={{ __html: displayReview }}
                />

                {hasLongReview && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-4 flex items-center gap-2 text-sm uppercase tracking-widest font-serif hover:text-accent transition-colors"
                    >
                        {isExpanded ? (
                            <>{t('readLess')} <ChevronUp size={14} /></>
                        ) : (
                            <>{t('readMore')} <ChevronDown size={14} /></>
                        )}
                    </button>
                )}
            </div>

            <footer className="mt-8 flex justify-end">
                <a
                    href={review.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-serif opacity-40 hover:opacity-100 hover:text-accent transition-all duration-300"
                >
                    {t('viewOnLetterboxd')} <ExternalLink size={10} />
                </a>
            </footer>
        </article>
    );
}
