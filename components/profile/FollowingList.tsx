'use client'

import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import type { FollowedUser } from '@/types/database'

interface FollowingListProps {
  users: FollowedUser[]
}

export default function FollowingList({ users }: FollowingListProps) {
  const t = useTranslations('profile')

  return (
    <div>
      {/* Header with count */}
      <h2 className="text-sm font-serif uppercase tracking-widest text-sepia-dark mb-4">
        {t('followingCount', { count: users.length })}
      </h2>

      {/* List of follows */}
      {users.length > 0 ? (
        <div className="border-4 border-black bg-background">
          {users.map((user, index) => (
            <a
              key={user.username}
              href={`https://letterboxd.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between px-4 py-3 hover:bg-foreground/5 transition-colors group ${
                index !== users.length - 1 ? 'border-b border-foreground/10' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-foreground">
                  @{user.username}
                </span>
                {user.display_name && (
                  <span className="text-xs font-serif text-sepia-dark">
                    ({user.display_name})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sepia-dark group-hover:text-foreground transition-colors">
                <span className="text-xs font-serif hidden sm:inline">
                  letterboxd.com/{user.username}
                </span>
                <ExternalLink size={14} />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="border-4 border-black bg-[#f4efdf] p-6 text-center">
          <p className="text-sm font-serif text-sepia-dark italic">
            No users followed yet.
          </p>
        </div>
      )}
    </div>
  )
}
