const AdminFlag = require("../models/AdminFlag");
const { Queue } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379
};

const livePlaylistQueue = new Queue("live-playlist", { connection });

async function isLivePlaylistEnabled() {
  const flag = await AdminFlag.findOne({ key: "LIVE_PLAYLIST" });
  return flag?.enabled || false;
}

async function enableLivePlaylist() {
  let flag = await AdminFlag.findOne({ key: "LIVE_PLAYLIST" });
  if (!flag) flag = new AdminFlag({ key: "LIVE_PLAYLIST" });
  flag.enabled = true;
  await flag.save();

  // Add a job to the queue so worker starts running
  await livePlaylistQueue.add("runBatch", { timestamp: Date.now() });
}

async function disableLivePlaylist() {
  const flag = await AdminFlag.findOne({ key: "LIVE_PLAYLIST" });
  if (flag) {
    flag.enabled = false;
    await flag.save();
  }
}

module.exports = {
  isLivePlaylistEnabled,
  enableLivePlaylist,
  disableLivePlaylist
};
