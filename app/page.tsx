'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import UserList from '@/components/UserList';
import ReviewCard from '@/components/ReviewCard';
import { Loader2, ScrollText, Coffee } from 'lucide-react';

import { Review } from './api/feed/route';

export default function Home() {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async (names: string[]) => {
    if (names.length === 0) {
      setReviews([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/feed?usernames=${names.join(',')}`);
      if (!resp.ok) throw new Error('Failed to fetch reviews');
      const data = await resp.json();
      setReviews(data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les chroniques. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(usernames);
  }, [usernames]);

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <aside className="lg:col-span-4 order-2 lg:order-1">
          <UserList onUsersChange={setUsernames} />

          <div className="mt-12 p-6 border border-foreground/10 font-serif italic text-sm text-sepia-dark leading-relaxed">
            <p>« Le cinéma n'est pas un spectacle, c'est une écriture. »</p>
            <p className="mt-2 text-right">— Jean Cocteau</p>
          </div>
        </aside>

        <section className="lg:col-span-8 order-1 lg:order-2">
          <div className="flex items-center justify-between mb-12 border-b-2 border-foreground pb-4">
            <h2 className="text-4xl font-serif font-black uppercase tracking-tighter">Le Flux Récent</h2>
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
              <p className="font-serif italic text-xl">Aucune chronique trouvée pour ces cinéphiles.</p>
            </div>
          )}

          {!loading && usernames.length === 0 && (
            <div className="py-32 text-center border-2 border-foreground/5 bg-foreground/[0.02]">
              <Coffee className="mx-auto mb-6 text-sepia-dark" size={64} />
              <h3 className="text-3xl font-serif font-bold mb-4">Bienvenue au Village</h3>
              <p className="font-serif italic text-sepia-dark max-w-sm mx-auto leading-relaxed">
                Commencez par suivre des cinéphiles pour voir leurs dernières chroniques s'afficher ici.
              </p>
            </div>
          )}

          <div className="space-y-16">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {loading && reviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-12 h-12 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin"></div>
              <p className="font-serif italic text-xl animate-pulse text-sepia-dark">Récupération des archives en cours...</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
