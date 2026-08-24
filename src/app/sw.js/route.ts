import { NextResponse } from "next/server";

export async function GET() {
  const content = `
    self.addEventListener('install', function(e) {
      self.skipWaiting();
    });
    self.addEventListener('activate', function(e) {
      e.waitUntil(
        self.registration.unregister().then(function() {
          return self.clients.matchAll();
        }).then(function(clients) {
          clients.forEach(client => client.navigate(client.url));
        })
      );
    });
  `;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
