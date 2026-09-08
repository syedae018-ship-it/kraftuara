import { NextResponse } from "next/server";

export async function GET() {
  const content = `
    const CACHE_NAME = 'kraftaura-v1.0.3';
    const STATIC_ASSETS = [
      '/manifest.webmanifest'
    ];

    self.addEventListener('install', (event) => {
      self.skipWaiting();
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll(STATIC_ASSETS).catch((err) => {
            console.warn('[SW] Cache addAll skipped non-critical item:', err);
          });
        })
      );
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((keys) => {
          return Promise.all(
            keys.map((key) => {
              if (key !== CACHE_NAME) {
                return caches.delete(key);
              }
            })
          );
        }).then(() => self.clients.claim())
      );
    });

    self.addEventListener('fetch', (event) => {
      const url = new URL(event.request.url);

      // NEVER cache Supabase API, Auth calls, or sensitive API routes
      if (
        url.pathname.startsWith('/api/') ||
        url.hostname.includes('supabase.co') ||
        event.request.method !== 'GET' ||
        event.request.headers.get('Authorization')
      ) {
        return;
      }

      // For static assets (_next/static, fonts, icons), use Stale-While-Revalidate
      if (
        url.pathname.startsWith('/_next/static') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico')
      ) {
        event.respondWith(
          caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              }
              return networkResponse;
            }).catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
          })
        );
        return;
      }

      // Network first for HTML navigation pages - do not fallback to landing for protected app routes
      if (event.request.mode === 'navigate') {
        const isAppRoute = url.pathname.startsWith('/dashboard') ||
          url.pathname.startsWith('/admin') ||
          url.pathname.startsWith('/checkout') ||
          url.pathname.startsWith('/create-store') ||
          url.pathname.startsWith('/choose-plan');

        event.respondWith(
          fetch(event.request).catch(() => {
            if (isAppRoute) {
              return caches.match(event.request) as any;
            }
            return caches.match(event.request).then((response) => {
              return response || caches.match('/');
            });
          })
        );
      }
    });
  `;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
