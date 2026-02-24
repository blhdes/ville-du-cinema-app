import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { PublicProfile } from '@/types/database'
import type { Metadata } from 'next'
import PublicProfileView from './PublicProfileView'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_data')
    .select('username, display_name, bio, avatar_url')
    .eq('username', username.toLowerCase())
    .single()

  if (!data) {
    return { title: 'Profile Not Found' }
  }

  const displayName = data.display_name || `@${data.username}`

  return {
    title: `${displayName} — Village du Cinéma`,
    description: data.bio || `${displayName}'s cinephile profile on Village du Cinéma`,
    openGraph: {
      title: `${displayName} — Village du Cinéma`,
      description: data.bio || `${displayName}'s cinephile profile`,
      ...(data.avatar_url && { images: [{ url: data.avatar_url }] }),
    },
    alternates: {
      canonical: `/u/${data.username}`,
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_data')
    .select('username, display_name, avatar_url, bio, followed_users')
    .eq('username', username.toLowerCase())
    .single()

  if (error || !data) {
    notFound()
  }

  const profile: PublicProfile = {
    username: data.username,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    bio: data.bio ?? '',
    followed_users: data.followed_users ?? [],
  }

  return <PublicProfileView profile={profile} />
}
