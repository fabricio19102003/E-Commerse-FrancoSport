import axios from './axios';

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const notificationsService = {
    getVapidKey: async () => {
        const response = await axios.get<{ success: boolean; publicKey: string }>('/notifications/vapid-key');
        return response.data.publicKey;
    },

    subscribeToPush: async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging is not supported');
            return;
        }

        try {
            // Register Service Worker
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered');

            // Check permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Permission not granted for Notification');
            }

            // Get VAPID Key
            const publicKey = await notificationsService.getVapidKey();
            const convertedVapidKey = urlBase64ToUint8Array(publicKey);

            // Subscribe
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            });

            // Send subscription to backend
            await axios.post('/notifications/subscribe', subscription);
            console.log('User subscribed to push notifications');
            return true;
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            return false;
        }
    },
};
