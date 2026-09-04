const DEFAULT_LOCALE = 'ko';

/* ------------------------------ server ------------------------------ */

const getServerCookie = async (name: string): Promise<string | null> => {
  const { cookies } = await import('next/headers');

  const cookieStore = await cookies();

  return cookieStore.get(name)?.value ?? null;
};

export const getServerRefreshToken = (): Promise<string | null> =>
  getServerCookie('refreshToken');

export const getServerAccessToken = (): Promise<string | null> =>
  getServerCookie('accessToken');

export const getServerLocale = async (): Promise<string> =>
  (await getServerCookie('NEXT_LOCALE')) ?? DEFAULT_LOCALE;

/* ------------------------------ client ------------------------------ */

const getClientCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!match) return null;

  return decodeURIComponent(match.slice(match.indexOf('=') + 1));
};

export const getClientRefreshToken = (): string | null =>
  getClientCookie('refreshToken');

export const getClientAccessToken = (): string | null =>
  getClientCookie('accessToken');

export const getClientLocale = (): string =>
  getClientCookie('NEXT_LOCALE') ?? DEFAULT_LOCALE;