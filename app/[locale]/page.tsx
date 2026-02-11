'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import UserList from '@/components/UserList';
import ReviewCard from '@/components/ReviewCard';
import WatchNotification from '@/components/WatchNotification';
import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import AnimatedWelcomeLogo from '@/components/AnimatedWelcomeLogo';
import MigrationModal from '@/components/MigrationModal';
import { ArrowLeft, ArrowRight, Loader2, ScrollText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDisplayPreferences } from '@/hooks/useDisplayPreferences';
import { useProfile } from '@/hooks/useProfile';

import { Review } from '../api/feed/route';

export default function Home() {
  const t = useTranslations();
  const {
    preferences: { hideUserlistMain, feedGridColumns, hideWatchNotifications },
    isLoading: prefsLoading,
  } = useDisplayPreferences();
  const { profile } = useProfile();
  const feedTitleRef = useRef<HTMLHeadingElement>(null);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [userListKey, setUserListKey] = useState(0);
  const [fading, setFading] = useState(false);

  // When UserList is hidden, load usernames directly from profile
  useEffect(() => {
    if (hideUserlistMain && profile?.followed_users) {
      setUsernames(profile.followed_users.map((u) => u.username));
    }
  }, [hideUserlistMain, profile?.followed_users]);

  // Clear feed state on logout
  useEffect(() => {
    if (!profile) {
      setUsernames([]);
      setReviews([]);
      setPage(1);
      setHasMore(false);
      setError(null);
    }
  }, [profile]);

  // Force UserList to refresh after migration
  const handleMigrationComplete = useCallback(() => {
    setUserListKey((k) => k + 1);
  }, []);

  const fetchReviews = async (names: string[], pageNum: number) => {
    if (names.length === 0) {
      setReviews([]);
      setHasMore(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/feed?usernames=${names.join(',')}&page=${pageNum}`);
      if (!resp.ok) throw new Error('Failed to fetch reviews');
      const data = await resp.json();
      setReviews(data.reviews);
      setHasMore(data.hasMore);
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
    setFading(true);
    feedTitleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Wait for fade-out, then fetch new page
    setTimeout(async () => {
      setPage(newPage);
      await fetchReviews(usernames, newPage);
      setFading(false);
    }, 200);
  };

  if (prefsLoading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4 order-2 lg:order-1 space-y-4">
              <div className="h-8 bg-black/10 w-48 mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 border-4 border-black/10 bg-[#f4efdf]" />
              ))}
            </div>
            <div className="lg:col-span-8 order-1 lg:order-2">
              <div className="h-10 bg-black/10 w-64 mb-12 border-b-2 border-black/10" />
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-4 border-black/10 bg-[#f4efdf] p-6">
                    <div className="h-6 bg-black/10 w-3/4 mb-4" />
                    <div className="h-4 bg-black/10 w-1/2 mb-2" />
                    <div className="h-4 bg-black/10 w-full mb-2" />
                    <div className="h-4 bg-black/10 w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={hideUserlistMain ? 'max-w-7xl mx-auto' : 'grid grid-cols-1 lg:grid-cols-12 gap-16'}>
        {!hideUserlistMain && (
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <UserList key={userListKey} onUsersChange={setUsernames} />
            <QuoteOfTheDay />
          </aside>
        )}

        <section className={hideUserlistMain ? '' : 'lg:col-span-8 order-1 lg:order-2'}>
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
              <AnimatedWelcomeLogo />
              <h3 className="text-3xl font-serif font-bold mb-4">{t('feed.welcome.title')}</h3>
              <p className="font-serif text-sepia-dark max-w-md mx-auto leading-relaxed text-lg">
                {t('feed.welcome.message')}
              </p>
            </div>
          )}

          <div
            className="transition-opacity duration-200 ease-in-out"
            style={{ opacity: fading ? 0 : 1 }}
          >
            <div className={
              feedGridColumns === 1
                ? 'space-y-16'
                : feedGridColumns === 2
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-8'
                  : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
            }>
              {(hideWatchNotifications || feedGridColumns > 1 ? reviews.filter(r => r.type !== 'watch') : reviews).map((review) => (
                review.type === 'watch' ? (
                  <WatchNotification key={review.id} item={review} />
                ) : (
                  <ReviewCard key={review.id} review={review} />
                )
              ))}
            </div>

            {!loading && reviews.length > 0 && (page > 1 || hasMore) && (
              <div className="flex justify-between items-center mt-16 pt-8 border-t border-foreground/10 font-serif">
                {page > 1 ? (
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold hover:text-accent transition-colors"
                  >
                    <ArrowLeft size={14} /> {t('pagination.previous')}
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="text-sm italic text-sepia-dark">
                  {t('pagination.page', { number: page })}
                </div>
                {hasMore ? (
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold hover:text-accent transition-colors"
                  >
                    {t('pagination.next')} <ArrowRight size={14} />
                  </button>
                ) : (
                  <div></div>
                )}
              </div>
            )}
          </div>

          {loading && reviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-12 h-12 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin"></div>
              <p className="font-serif italic text-xl animate-pulse text-sepia-dark">{t('feed.loading')}</p>
            </div>
          )}
        </section>
      </div>

      <MigrationModal onComplete={handleMigrationComplete} />
    </Layout>
  );
}
