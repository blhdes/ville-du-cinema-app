export const CINEMA_AVATARS = [
  { id: 0, emoji: '🎬', label: 'Clapperboard' },
  { id: 1, emoji: '🎥', label: 'Camera' },
  { id: 2, emoji: '📽️', label: 'Projector' },
  { id: 3, emoji: '🎞️', label: 'Film' },
  { id: 4, emoji: '🎭', label: 'Theater' },
  { id: 5, emoji: '🍿', label: 'Popcorn' },
  { id: 6, emoji: '📺', label: 'TV' },
  { id: 7, emoji: '🌙', label: 'Moon' },
  { id: 8, emoji: '⭐', label: 'Star' },
  { id: 9, emoji: '👁️', label: 'Eye' },
  { id: 10, emoji: '🎪', label: 'Circus' },
  { id: 11, emoji: '🖤', label: 'Heart' },
] as const;

export type CinemaAvatar = (typeof CINEMA_AVATARS)[number];
export const AVATAR_COUNT = CINEMA_AVATARS.length;
