export const DEFAULT_LOGO = '/logo-cfa.png';
export const DEFAULT_AVATAR = '/logo-cfa.png';

const BLOCKED_HOST_PATTERN = /fbcdn\.net|facebook\.com/i;

export function safeLogoUrl(url?: string | null): string {
  if (!url || BLOCKED_HOST_PATTERN.test(url)) return DEFAULT_LOGO;
  return url;
}

export function safePhotoUrl(url?: string | null): string {
  if (!url || BLOCKED_HOST_PATTERN.test(url)) return DEFAULT_AVATAR;
  return url;
}

export function handleImgFallback(
  e: { currentTarget: HTMLImageElement },
  fallback: string = DEFAULT_LOGO,
) {
  const img = e.currentTarget;
  if (img.src !== fallback && !img.src.endsWith(fallback)) {
    img.src = fallback;
  }
}
