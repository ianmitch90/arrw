import { useEffect } from 'react';
import { useUserSession } from '../hooks/useUserSession';

export function PushNotificationSubscriber() {
  const { user, preferences } = useUserSession();

  useEffect(() => {
    if (
      user &&
      preferences?.pushNotifications &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY'
        });

        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, userId: user.id })
        });
      });
    }
  }, [user, preferences]);

  return null;
}
