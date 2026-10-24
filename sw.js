/**
 * Xestus BizCraft - Offline Service Worker
 * Guarantees 100% offline functionality.
 */

const CACHE_NAME = 'xestus-bizcraft-v1.0.3';

const STATIC_ASSETS = [
  './',
  './index.html',
  './gst-invoice-generator.html',
  './upi-qr-generator.html',
  './rent-receipt-generator.html',
  './salary-slip-generator.html',
  './payment-voucher.html',
  './vault.html',
  './manifest.json',
  './favicon.svg',
  './sitemap.xml',
  './robots.txt',
  './css/design-tokens.css',
  './css/base.css',
  './css/components.css',
  './css/invoice.css',
  './css/upi-qr.css',
  './css/rent-receipt.css',
  './css/salary-slip.css',
  './css/vault.css',
  './css/print.css',
  './js/app.js',
  './js/storage.js',
  './js/security.js',
  './js/invoice.js',
  './js/upi-qr.js',
  './js/rent-receipt.js',
  './js/salary-slip.js',
  './js/number-to-words.js',
  './js/pdf-export.js',
  './js/lib/qrcode.js',
  './js/lib/canvas-confetti.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
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
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update in background (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback to cached index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
