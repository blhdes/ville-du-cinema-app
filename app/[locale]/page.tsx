'use client';

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import UserList from '@/components/UserList';
import ReviewCard from '@/components/ReviewCard';
import WatchNotification from '@/components/WatchNotification';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import { ArrowLeft, ArrowRight, Loader2, ScrollText, Coffee } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Review } from '../api/feed/route';

export default function Home() {
  const t = useTranslations();
  const feedTitleRef = useRef<HTMLHeadingElement>(null);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchReviews = async (names: string[], pageNum: number) => {
    if (names.length === 0) {
      setReviews([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/feed?usernames=${names.join(',')}&page=${pageNum}`);
      if (!resp.ok) throw new Error('Failed to fetch reviews');
      const data = await resp.json();
      setReviews(data);
    } catch (err) {
      console.error(err);
      setError(t('feed.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchReviews(usernames, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernames]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchReviews(usernames, newPage);

    // Scroll to feed title after content updates
    setTimeout(() => {
      feedTitleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <aside className="lg:col-span-4 order-2 lg:order-1">
          <UserList onUsersChange={setUsernames} />
          <QuoteOfTheDay />
        </aside>

        <section className="lg:col-span-8 order-1 lg:order-2">
          <div className="flex items-center justify-between mb-12 border-b-2 border-foreground pb-4">
            <h2 ref={feedTitleRef} className="text-4xl font-serif font-black uppercase tracking-tighter">{t('feed.title')}</h2>
            {loading && <Loader2 className="animate-spin text-accent" size={24} />}
          </div>

          {error && (
            <div className="bg-accent/5 border border-accent text-accent p-6 mb-12 font-serif italic">
              {error}
            </div>
          )}

          {!loading && reviews.length === 0 && usernames.length > 0 && (
            <div className="py-24 text-center border-2 border-dashed border-foreground/10 opacity-40">
              <ScrollText className="mx-auto mb-4" size={48} />
              <p className="font-serif italic text-xl">{t('feed.empty')}</p>
            </div>
          )}

          {!loading && usernames.length === 0 && (
            <div className="py-32 text-center border-2 border-foreground/5 bg-foreground/[0.02]">
              <Coffee className="mx-auto mb-6 text-sepia-dark" size={64} />
              <h3 className="text-3xl font-serif font-bold mb-4">{t('feed.welcome.title')}</h3>
              <p className="font-serif italic text-sepia-dark max-w-sm mx-auto leading-relaxed">
                {t('feed.welcome.message')}
              </p>
            </div>
          )}

          <div className="space-y-16">
            {reviews.map((review) => (
              review.type === 'watch' ? (
                <WatchNotification key={review.id} item={review} />
              ) : (
                <ReviewCard key={review.id} review={review} />
              )
            ))}
          </div>

          {!loading && reviews.length > 0 && (
            <div className="flex justify-between items-center mt-16 pt-8 border-t border-foreground/10 font-serif">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold disabled:opacity-20 hover:text-accent transition-colors disabled:cursor-not-allowed"
              >
                <ArrowLeft size={14} /> {t('pagination.previous')}
              </button>
              <div className="text-sm italic text-sepia-dark">
                {t('pagination.page', { number: page })}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={reviews.length < 50}
                className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold disabled:opacity-20 hover:text-accent transition-colors disabled:cursor-not-allowed"
              >
                {t('pagination.next')} <ArrowRight size={14} />
              </button>
            </div>
          )}

          {loading && reviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-12 h-12 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin"></div>
              <p className="font-serif italic text-xl animate-pulse text-sepia-dark">{t('feed.loading')}</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
