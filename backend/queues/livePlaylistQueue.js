const { Queue } = require("bullmq");
const connection = { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT || 6379 };
const queue = new Queue("live-playlist", { connection });

async function enqueueLivePlaylistBatch() {
  const { isLivePlaylistEnabled } = require("../helper/livePlaylist.db");
  if (await isLivePlaylistEnabled()) {
    await queue.add("run-batch", {});
    console.log("Enqueued live playlist batch");
  }
}

// Example: enqueue every 30s
setInterval(enqueueLivePlaylistBatch, 30000);
