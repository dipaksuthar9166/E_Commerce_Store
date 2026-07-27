/**
 * Broadcast order status to shop, order-track, and customer personal rooms.
 * Always stringify IDs so room names stay stable.
 */
function toPlain(doc) {
  if (!doc) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject({ virtuals: true });
  return doc;
}

function idStr(value) {
  if (value == null) return null;
  if (typeof value === 'object') {
    if (value._id != null) return String(value._id);
    if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
      const s = value.toString();
      if (s && s !== '[object Object]') return s;
    }
    return null;
  }
  return String(value);
}

/**
 * @param {import('socket.io').Server | null | undefined} io
 * @param {object} order - order doc (may be lean / populated)
 * @param {object} [payload] - optional richer payload; defaults to order
 */
function emitOrderStatusUpdated(io, order, payload) {
  if (!io || !order) return;

  const data = toPlain(payload || order);
  // Ensure _id is a plain string for reliable client matching
  if (data && data._id != null) data._id = String(data._id);

  const orderId = idStr(order._id || data?._id);
  const shopId = idStr(order.shopId || data?.shopId);
  const userId = idStr(order.userId || data?.userId);

  if (shopId) io.to(`shop_${shopId}`).emit('orderStatusUpdated', data);
  if (orderId) io.to(`order_track_${orderId}`).emit('orderStatusUpdated', data);
  if (userId) io.to(`user_${userId}`).emit('orderStatusUpdated', data);
}

module.exports = { emitOrderStatusUpdated, idStr, toPlain };
