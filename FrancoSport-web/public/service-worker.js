/**
 * Service Worker for Push Notifications
 * Franco Sport E-Commerce
 */

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png', // Ensure this icon exists
      badge: '/badge-72x72.png', // Ensure this icon exists
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || '/'
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver Detalles',
          icon: '/checkmark.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/xmark.png'
        },
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the URL
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
