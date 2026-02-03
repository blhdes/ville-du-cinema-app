'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import localforage from 'localforage';
import { useUser } from '@/hooks/useUser';

const LOCALFORAGE_KEY = 'followed_users';
const SESSION_KEY = 'migration_modal_dismissed';

type ModalState = 'idle' | 'migrating' | 'success' | 'error';

interface MigrationResult {
    migrated: number;
    skipped: number;
}

interface MigrationModalProps {
    onComplete: (result: MigrationResult) => void;
}

export default function MigrationModal({ onComplete }: MigrationModalProps) {
    const t = useTranslations('migration');
    const { user, isLoading: isAuthLoading } = useUser();
    const [isVisible, setIsVisible] = useState(false);
    const [localUsers, setLocalUsers] = useState<string[]>([]);
    const [state, setState] = useState<ModalState>('idle');
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [result, setResult] = useState<MigrationResult>({ migrated: 0, skipped: 0 });
    const [mounted, setMounted] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const previousUserRef = useRef<typeof user>(undefined);

    // Track mount state for portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Detect auth transition (null → user) and check for local data
    useEffect(() => {
        console.log('[MigrationModal] Effect triggered:', { isAuthLoading, user: user?.id ?? null });

        if (isAuthLoading) {
            console.log('[MigrationModal] Auth still loading, skipping');
            return;
        }

        const checkMigration = async () => {
            const previousUser = previousUserRef.current;
            const wasLoggedOut = previousUser === null;
            const isNowLoggedIn = user !== null;

            console.log('[MigrationModal] Checking migration:', {
                previousUser: previousUser === undefined ? 'undefined' : (previousUser?.id ?? 'null'),
                currentUser: user?.id ?? 'null',
                wasLoggedOut,
                isNowLoggedIn
            });

            // Update ref AFTER capturing previous value
            previousUserRef.current = user;

            // First render: just initialize, don't trigger
            if (previousUser === undefined) {
                console.log('[MigrationModal] First render, initializing ref');
                return;
            }

            // Clear dismiss flag on logout so modal shows again on next login
            if (user === null) {
                console.log('[MigrationModal] User logged out, clearing dismiss flag');
                sessionStorage.removeItem(SESSION_KEY);
                return;
            }

            // Only trigger on actual transition from null → user
            if (!wasLoggedOut || !isNowLoggedIn) {
                console.log('[MigrationModal] Not a login transition, skipping');
                return;
            }

            console.log('[MigrationModal] Login transition detected!');

            // Check if already dismissed this login session
            const dismissed = sessionStorage.getItem(SESSION_KEY);
            if (dismissed) {
                console.log('[MigrationModal] Already dismissed this session');
                return;
            }

            // Check for local data
            const savedUsers = await localforage.getItem<string[]>(LOCALFORAGE_KEY);
            console.log('[MigrationModal] Local users:', savedUsers);

            if (savedUsers && savedUsers.length > 0) {
                console.log('[MigrationModal] Showing modal with', savedUsers.length, 'users');
                setLocalUsers(savedUsers);
                setIsVisible(true);
            } else {
                console.log('[MigrationModal] No local users to migrate');
            }
        };

        checkMigration();
    }, [user, isAuthLoading]);

    // Focus trap
    useEffect(() => {
        if (!isVisible) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && state === 'idle') {
                handleDiscard();
            }

            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        modalRef.current?.focus();

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, state]);

    const handleMigrate = useCallback(async () => {
        setState('migrating');
        setProgress({ current: 0, total: localUsers.length });

        let successCount = 0;
        let skipCount = 0;

        for (let i = 0; i < localUsers.length; i++) {
            const username = localUsers[i];
            setProgress({ current: i + 1, total: localUsers.length });

            try {
                const res = await fetch('/api/lists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username }),
                });

                if (res.ok) {
                    successCount++;
                } else if (res.status === 409) {
                    // Already exists, silent skip
                    skipCount++;
                }
            } catch {
                // Continue with others
            }
        }

        // Clean localforage after migration
        await localforage.removeItem(LOCALFORAGE_KEY);

        setResult({ migrated: successCount, skipped: skipCount });
        setState('success');

        // Auto-close after 2s
        setTimeout(() => {
            setIsVisible(false);
            onComplete({ migrated: successCount, skipped: skipCount });
        }, 2000);
    }, [localUsers, onComplete]);

    const handleDiscard = useCallback(() => {
        // Keep data in localforage - user chose not to migrate now
        // Only hide modal for this session
        sessionStorage.setItem(SESSION_KEY, 'true');

        setIsVisible(false);
        onComplete({ migrated: 0, skipped: 0 });
    }, [onComplete]);

    const handleRetry = useCallback(() => {
        setState('idle');
    }, []);

    if (!mounted || !isVisible) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="migration-title"
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={state === 'idle' ? handleDiscard : undefined}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full outline-none"
            >
                {/* Header */}
                <div className="bg-black text-[#FFD600] px-4 py-3 flex items-center justify-between">
                    <h2
                        id="migration-title"
                        className="text-lg font-serif font-black uppercase tracking-tight flex items-center gap-2"
                    >
                        <span className="text-xs">████</span>
                        {t('title')}
                        <span className="text-xs">████</span>
                    </h2>
                    {state === 'idle' && (
                        <button
                            onClick={handleDiscard}
                            className="text-[#FFD600] hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {state === 'idle' && (
                        <>
                            <p className="font-serif text-base mb-2">
                                {t('message', { count: localUsers.length })}
                            </p>
                            <p className="font-serif text-base mb-4">
                                {t('prompt')}
                            </p>

                            {/* User list */}
                            <div className="bg-[#FFD600] border-2 border-black p-3 mb-4 max-h-40 overflow-y-auto">
                                {localUsers.map((username) => (
                                    <div
                                        key={username}
                                        className="font-serif font-bold text-sm py-1"
                                    >
                                        @{username}
                                    </div>
                                ))}
                            </div>

                            <p className="font-serif text-sm text-gray-600 mb-6">
                                {t('noDuplicates')}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleDiscard}
                                    className="bg-white text-black border-2 border-black px-4 py-2 font-serif font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                                >
                                    {t('discard')}
                                </button>
                                <button
                                    onClick={handleMigrate}
                                    className="bg-[#E63946] text-white border-2 border-black px-4 py-2 font-serif font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                >
                                    {t('sync')}
                                </button>
                            </div>
                        </>
                    )}

                    {state === 'migrating' && (
                        <div className="py-8 text-center">
                            <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                            <p className="font-serif text-base">
                                {t('syncing', { current: progress.current, total: progress.total })}
                            </p>
                        </div>
                    )}

                    {state === 'success' && (
                        <div className="py-8 text-center">
                            <CheckCircle className="mx-auto mb-4 text-green-600" size={32} />
                            <p className="font-serif text-base font-bold">
                                {t('success', { count: result.migrated })}
                            </p>
                            {result.skipped > 0 && (
                                <p className="font-serif text-sm text-gray-600 mt-2">
                                    {t('skipped', { count: result.skipped })}
                                </p>
                            )}
                        </div>
                    )}

                    {state === 'error' && (
                        <div className="py-8 text-center">
                            <AlertCircle className="mx-auto mb-4 text-[#E63946]" size={32} />
                            <p className="font-serif text-base mb-4">
                                {t('error')}
                            </p>
                            <button
                                onClick={handleRetry}
                                className="bg-[#E63946] text-white border-2 border-black px-4 py-2 font-serif font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                {t('retry')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
