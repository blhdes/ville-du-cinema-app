'use client';

import { useTranslations } from 'next-intl';
import { getQuoteOfTheWeek } from '@/constants/filmmakerQuotes';

export default function QuoteOfTheDay() {
    const t = useTranslations('quotes');
    const quoteOfWeek = getQuoteOfTheWeek();
    const quoteText = t(`quote${quoteOfWeek.id}.text`);

    return (
        <div className="mt-12 p-6 border border-foreground/10 font-serif italic text-sm text-sepia-dark leading-relaxed">
            <p>{quoteText}</p>
            <p className="mt-2 text-right not-italic font-bold">— {quoteOfWeek.author}</p>
        </div>
    );
}
