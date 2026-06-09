// JTG FX Journal Service Worker for Notifications

self.addEventListener('install', (event) => {
    // Force active immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Open or focus application window
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Find existing tab/window of the app and focus it
            for (const client of clientList) {
                if (client.url.includes('/index.html') || client.url === '/' || client.url.includes(self.location.origin)) {
                    if ('focus' in client) {
                        return client.focus();
                    }
                }
            }
            // If no window is open, open a new one
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

// Handle push notification messages from a push service (for future FCM integration)
self.addEventListener('push', (event) => {
    let payload = {};
    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload = { title: 'JTG FX Journal', body: event.data.text() };
        }
    }

    const title = payload.title || 'Time to Journal!';
    const options = {
        body: payload.body || 'Don\'t forget to log today\'s trades in your JTG Journal!',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'daily-journal-reminder',
        requireInteraction: true,
        data: { url: '/' }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Listen to postMessage from the main app thread
self.addEventListener('message', (event) => {
    if (!event.data) return;

    // Handle immediate test notification
    if (event.data.type === 'TEST_NOTIFICATION') {
        self.registration.showNotification('JTG FX Journal', {
            body: 'Notification system is working! Don\'t forget to log your trades daily.',
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'journal-reminder-test',
            data: { url: '/' }
        });
    }
    
    // Handle Local Reminder trigger scheduling (experimental Notification Triggers)
    if (event.data.type === 'SCHEDULE_LOCAL_NOTIFICATION') {
        const { timestamp, title, body } = event.data;
        
        const options = {
            body: body || 'Keep your journaling streak alive!',
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'daily-journal-reminder',
            data: { url: '/' }
        };
        
        // Use Notification Triggers if supported
        if ('showTrigger' in Notification.prototype) {
            try {
                options.showTrigger = new TimestampTrigger(timestamp);
                self.registration.showNotification(title, options);
                console.log(`[SW] Scheduled trigger notification for: ${new Date(timestamp)}`);
            } catch (err) {
                console.error('[SW] Failed to use showTrigger, displaying immediately as fallback:', err);
                // Fallback to displaying notification now if scheduling fails
            }
        }
    }
});
