'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('layout');

    return (
        <footer className="w-full mt-32 pb-12 text-center font-serif px-6">
            <div className="border-t-4 border-foreground pt-12">
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
            </div>
        </footer>
    );
}
