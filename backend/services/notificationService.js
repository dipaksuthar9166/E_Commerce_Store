const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@mersko.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a user's registered devices.
 * @param {Object} user - The user document (must include pushSubscriptions)
 * @param {Object} payload - Notification data (title, body, url, icon, etc.)
 */
exports.sendPushNotification = async (user, payload) => {
  if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
    return;
  }

  const payloadString = JSON.stringify(payload);
  const subscriptionsToRemove = [];

  const sendPromises = user.pushSubscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, payloadString);
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Subscription has expired or is no longer valid
        console.log('Subscription expired or invalid. Removing endpoint:', sub.endpoint);
        subscriptionsToRemove.push(sub.endpoint);
      } else {
        console.error('Error sending push notification:', error);
      }
    }
  });

  await Promise.all(sendPromises);

  // Clean up stale subscriptions
  if (subscriptionsToRemove.length > 0) {
    user.pushSubscriptions = user.pushSubscriptions.filter(
      (sub) => !subscriptionsToRemove.includes(sub.endpoint)
    );
    await user.save();
  }
};
