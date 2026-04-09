const Redis = require("ioredis");

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379
});

/**
 * Stack Service for managing LIFO queues per venue
 * Uses Redis for persistent stack storage
 */

/**
 * Push a song request onto the venue's stack (LIFO)
 * @param {string} venueId - Venue ID
 * @param {object} requestData - Request data to push
 */
async function pushToStack(venueId, requestData) {
  try {
    const stackKey = `automix:stack:${venueId}`;
    const requestJSON = JSON.stringify(requestData);
    
    // LPUSH adds to the left (beginning) of the list
    // RPOP removes from the right (end) for true LIFO (newest first)
    await redis.lpush(stackKey, requestJSON);
    
    console.log(`📥 Added to stack: ${stackKey}`);
    console.log(`   Song: ${requestData.title} by ${requestData.artist}`);
    console.log(`   Request ID: ${requestData._id}`);
    
    // Set expiration: 24 hours
    await redis.expire(stackKey, 86400);
    
    return { success: true, message: "Request added to stack" };
  } catch (err) {
    console.error(`❌ Error pushing to stack:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Pop from the venue's stack (LIFO - gets most recent/last added)
 * @param {string} venueId - Venue ID
 */
async function popFromStack(venueId) {
  try {
    const stackKey = `automix:stack:${venueId}`;
    
    // LPOP removes from the left (beginning after LPUSH) - LIFO order (newest first)
    const requestJSON = await redis.lpop(stackKey);
    
    if (!requestJSON) {
      console.log(`📭 Stack is empty for venue: ${venueId}`);
      return { success: true, data: null, message: "Stack is empty" };
    }
    
    const requestData = JSON.parse(requestJSON);
    
    console.log(`📤 Popped from stack: ${stackKey}`);
    console.log(`   Song: ${requestData.title} by ${requestData.artist}`);
    console.log(`   Request ID: ${requestData._id}`);
    
    return { success: true, data: requestData };
  } catch (err) {
    console.error(`❌ Error popping from stack:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Remove a specific request from the stack
 * @param {string} venueId - Venue ID
 * @param {string} requestId - Request ID to remove
 */
async function removeFromStack(venueId, requestId) {
  try {
    const stackKey = `automix:stack:${venueId}`;
    
    // Get all items in the stack
    const stackItems = await redis.lrange(stackKey, 0, -1);
    
    let removed = false;
    for (const item of stackItems) {
      const requestData = JSON.parse(item);
      if (requestData._id === requestId) {
        // Found it, remove this item
        await redis.lrem(stackKey, 1, item);
        removed = true;
        console.log(`🗑️  Removed request from stack: ${requestId}`);
        break;
      }
    }
    
    if (!removed) {
      console.log(`⚠️  Request not found in stack: ${requestId}`);
      return { success: true, message: "Request not found in stack" };
    }
    
    return { success: true, message: "Request removed from stack" };
  } catch (err) {
    console.error(`❌ Error removing from stack:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get stack size (number of requests waiting)
 * @param {string} venueId - Venue ID
 */
async function getStackSize(venueId) {
  try {
    const stackKey = `automix:stack:${venueId}`;
    const size = await redis.llen(stackKey);
    
    console.log(`📊 Stack size for venue ${venueId}: ${size}`);
    return { success: true, data: size };
  } catch (err) {
    console.error(`❌ Error getting stack size:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Peek at the stack (see what's next without removing)
 * @param {string} venueId - Venue ID
 * @param {number} count - Number of items to peek (default 5)
 */
async function peekStack(venueId, count = 5) {
  try {
    const stackKey = `automix:stack:${venueId}`;
    
    // LRANGE from 0 to -1 gets all items in order (most recent first)
    const stackItems = await redis.lrange(stackKey, 0, count - 1);
    
    const items = stackItems.map(item => JSON.parse(item));
    
    console.log(`👁️  Peeking at stack for venue ${venueId}: ${items.length} items`);
    
    return { success: true, data: items };
  } catch (err) {
    console.error(`❌ Error peeking stack:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Clear entire stack for a venue
 * @param {string} venueId - Venue ID
 */
async function clearStack(venueId) {
  try {
    const stackKey = `automix:stack:${venueId}`;
    await redis.del(stackKey);
    
    console.log(`🔄 Cleared stack for venue ${venueId}`);
    return { success: true, message: "Stack cleared" };
  } catch (err) {
    console.error(`❌ Error clearing stack:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  pushToStack,
  popFromStack,
  removeFromStack,
  getStackSize,
  peekStack,
  clearStack
};
