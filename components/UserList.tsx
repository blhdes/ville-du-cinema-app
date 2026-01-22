'use client';

import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { UserPlus, UserMinus, User, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UserListProps {
    onUsersChange: (users: string[]) => void;
}

const DISCOVERY_USERS = ['dvds', 'monicanitro', 'brat', 'karstenz', 'david_eh'] as const;

export default function UserList({ onUsersChange }: UserListProps) {
    const t = useTranslations('userList');
    const [users, setUsers] = useState<string[]>([]);
    const [newUser, setNewUser] = useState('');

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

    const addUser = async (handle: string) => {
        const cleanHandle = handle.trim().toLowerCase();
        if (cleanHandle && !users.includes(cleanHandle)) {
            const updatedUsers = [...users, cleanHandle];
            setUsers(updatedUsers);
            await localforage.setItem('followed_users', updatedUsers);
            setNewUser('');
            onUsersChange(updatedUsers);
        }
    };

    const removeUser = async (handle: string) => {
        const updatedUsers = users.filter((u) => u !== handle);
        setUsers(updatedUsers);
        await localforage.setItem('followed_users', updatedUsers);
        onUsersChange(updatedUsers);
    };

    const showDiscovery = users.length < 5;

    return (
        <section className="bg-sepia-light border-2 border-foreground p-6 mb-12 relative">
            {/* Corner details for vintage feel */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-foreground"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-foreground"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-foreground"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-foreground"></div>

            <h3 className="text-xl font-serif font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
                <User size={20} /> {t('title')}
            </h3>

            <form onSubmit={(e) => { e.preventDefault(); addUser(newUser); }} className="flex flex-col sm:flex-row gap-2 mb-8">
                <input
                    type="text"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    placeholder={t('placeholder')}
                    className="w-full bg-background border border-foreground/20 px-4 py-2 font-body focus:outline-none focus:border-foreground transition-all placeholder:italic text-sm min-w-0"
                />
                <button
                    type="submit"
                    className="bg-foreground text-background px-4 py-2 font-serif font-bold text-xs uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-2 shrink-0"
                >
                    {t('followButton')}
                </button>
            </form>

            <div className="space-y-6">
                <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-serif font-bold mb-3 text-sepia-dark">{t('subscriptions')}</h4>
                    <ul className="space-y-1">
                        {users.length === 0 ? (
                            <p className="italic text-sepia-dark font-serif text-sm">{t('empty')}</p>
                        ) : (
                            users.map((user) => (
                                <li
                                    key={user}
                                    className="flex items-center justify-between py-1 group"
                                >
                                    <span className="font-serif text-lg leading-none">@{user}</span>
                                    <button
                                        onClick={() => removeUser(user)}
                                        className="text-sepia-dark hover:text-accent transition-colors p-1"
                                        title={t('removeUser', { user })}
                                    >
                                        <UserMinus size={14} />
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {showDiscovery && (
                    <div className="pt-6 border-t border-foreground/10">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-serif font-bold mb-4 text-sepia-dark flex items-center gap-2">
                            <Sparkles size={10} /> {t('discoveries')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {DISCOVERY_USERS.filter(u => !users.includes(u)).map((u) => (
                                <button
                                    key={u}
                                    onClick={() => addUser(u)}
                                    className="text-[10px] font-serif border border-foreground/20 px-2 py-1 hover:border-foreground hover:bg-foreground hover:text-background transition-all"
                                >
                                    +{u}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
