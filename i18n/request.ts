import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { routing } from './routing';

type Locale = (typeof routing.locales)[number];

function isValidLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

/**
 * Resolve locale for routes outside [locale] (e.g. /u/username).
 * Priority: NEXT_LOCALE cookie → authenticated user's DB language → Accept-Language header → default.
 */
async function resolveLocaleFromContext(): Promise<string> {
  // 1. NEXT_LOCALE cookie (set by next-intl middleware during locale-prefixed navigation)
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
    if (localeCookie && isValidLocale(localeCookie)) {
      return localeCookie;
    }
  } catch {
    // cookies() may not be available in all contexts
  }

  // 2. Authenticated user's stored language preference
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('user_data')
        .select('language')
        .eq('user_id', user.id)
        .single();

      if (data?.language && isValidLocale(data.language)) {
        return data.language;
      }
    }
  } catch {
    // Supabase may not be configured or query may fail
  }

  // 3. Accept-Language header
  try {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language');
    if (acceptLanguage) {
      const preferred = acceptLanguage
        .split(',')
        .map((part) => {
          const [lang, q] = part.trim().split(';q=');
          return { lang: lang.split('-')[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
        })
        .sort((a, b) => b.q - a.q);

      for (const { lang } of preferred) {
        if (isValidLocale(lang)) {
          return lang;
        }
      }
    }
  } catch {
    // headers() may not be available
  }

  // 4. Default
  return routing.defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // If locale is provided by the [locale] segment, validate and use it
  if (locale && isValidLocale(locale)) {
    return {
      locale,
      messages: (await import(`../messages/${locale}.json`)).default,
    };
  }

  // Non-[locale] route (e.g. /u/username) — resolve from context
  locale = await resolveLocaleFromContext();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
