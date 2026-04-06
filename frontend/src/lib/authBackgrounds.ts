/**
 * Default auth page backgrounds (Unsplash CDN — no API key; hotlink-friendly).
 * Override with Vite env to use your own URLs (e.g. Google Cloud Storage signed URLs).
 */
export const AUTH_BG_LOGIN =
  import.meta.env.VITE_AUTH_BG_LOGIN ??
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1920&q=80'

export const AUTH_BG_REGISTER =
  import.meta.env.VITE_AUTH_BG_REGISTER ??
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1920&q=80'
