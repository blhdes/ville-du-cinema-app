'use client';

import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { UserPlus, UserMinus, User, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DISCOVERY_USERS } from '@/constants/discoveryUsers';
import ErrorNotification from './ErrorNotification';

interface UserListProps {
    onUsersChange: (users: string[]) => void;
}

export default function UserList({ onUsersChange }: UserListProps) {
    const t = useTranslations('userList');
    const [users, setUsers] = useState<string[]>([]);
    const [newUser, setNewUser] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        const loadUsers = async () => {
            const savedUsers = await localforage.getItem<string[]>('followed_users');
            if (savedUsers) {
                setUsers(savedUsers);
                onUsersChange(savedUsers);
            }
        };
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const available = DISCOVERY_USERS.filter(u => !users.includes(u));
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 5));
    }, [users]);

    const addUser = async (handle: string) => {
        const cleanHandle = handle.trim().toLowerCase();

        if (!cleanHandle) return;

        if (users.includes(cleanHandle)) {
            return;
        }

        // Clear any previous errors
        setError(null);
        setIsValidating(true);

        try {
            // Validate user exists on Letterboxd
            const response = await fetch(`/api/validate-user?username=${encodeURIComponent(cleanHandle)}`);
            const data = await response.json();

            if (!data.exists) {
                setError(t('errors.userNotFound', { username: cleanHandle }));
                setIsValidating(false);
                return;
            }

            // User exists, add to list
            const updatedUsers = [...users, cleanHandle];
            setUsers(updatedUsers);
            await localforage.setItem('followed_users', updatedUsers);
            setNewUser('');
            onUsersChange(updatedUsers);
        } catch (err) {
            console.error('Error validating user:', err);
            setError(t('errors.validationFailed', { username: cleanHandle }));
        } finally {
            setIsValidating(false);
        }
    };

    const removeUser = async (handle: string) => {
        const updatedUsers = users.filter((u) => u !== handle);
        setUsers(updatedUsers);
        await localforage.setItem('followed_users', updatedUsers);
        onUsersChange(updatedUsers);
    };

    const showDiscovery = users.length < 5;

    // Cahiers color rotation for discovery buttons
    const cahiersColors = [
        'bg-[#FFD600] hover:bg-[#FFC400] text-black', // Yellow
        'bg-[#E63946] hover:bg-[#D32F2F] text-white', // Red
        'bg-[#2E86AB] hover:bg-[#1976D2] text-white', // Blue
    ];

    return (
        <>
            <section className="bg-[#FFD600] border-4 border-black p-6 mb-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                {/* Title block with black background */}
                <div className="bg-black text-[#FFD600] px-4 py-3 -mx-6 -mt-6 mb-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-serif font-black flex items-center gap-2 uppercase tracking-tighter">
                        <User size={20} /> {t('title')}
                    </h3>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[#FFD600] hover:text-[#FFC400] transition-colors p-1"
                        aria-label={isExpanded ? t('collapse') : t('expand')}
                    >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pb-3">
                <form onSubmit={(e) => { e.preventDefault(); addUser(newUser); }} className="flex flex-col sm:flex-row gap-2 mb-8">
                <input
                    type="text"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    placeholder={t('placeholder')}
                    className="w-full bg-white border-2 border-black px-4 py-2 font-body focus:outline-none focus:ring-2 focus:ring-black placeholder:italic text-sm min-w-0"
                />
                <button
                    type="submit"
                    disabled={isValidating}
                    className="bg-[#E63946] hover:bg-[#D32F2F] text-white border-2 border-black px-4 py-2 font-serif font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                    <UserPlus size={14} /> {isValidating ? '...' : t('followButton')}
                </button>
            </form>

            <div className="space-y-6">
                <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-serif font-bold mb-3 bg-black text-[#FFD600] px-2 py-1 inline-block">
                        {t('subscriptions')}
                    </h4>
                    <ul className="space-y-2 mt-3">
                        {users.length === 0 ? (
                            <p className="italic font-serif text-sm bg-white border-2 border-black p-3">
                                {t('empty')}
                            </p>
                        ) : (
                            users.map((user) => (
                                <li
                                    key={user}
                                    className="flex items-center justify-between py-2 px-3 bg-white border-2 border-black group hover:bg-black hover:text-white transition-colors"
                                >
                                    <span className="font-serif text-base font-bold">@{user}</span>
                                    <button
                                        onClick={() => removeUser(user)}
                                        className="opacity-60 group-hover:opacity-100 hover:text-[#E63946] transition-all p-1"
                                        title={t('removeUser', { user })}
                                    >
                                        <UserMinus size={16} />
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {showDiscovery && (
                    <div className="pt-6 border-t-4 border-black">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-serif font-bold mb-4 bg-black text-[#FFD600] px-2 py-1 inline-flex items-center gap-2">
                            <Sparkles size={10} /> {t('discoveries')}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {suggestions.map((u, index) => (
                                <button
                                    key={u}
                                    onClick={() => addUser(u)}
                                    className={`text-[10px] font-serif font-bold border-2 border-black px-3 py-1.5 uppercase tracking-wider transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] ${cahiersColors[index % 3]}`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            </div>
            </div>
            </section>

            {/* Error notification */}
            {error && (
                <ErrorNotification
                    message={error}
                    onClose={() => setError(null)}
                />
            )}
        </>
    );
}
