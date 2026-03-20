const { Queue } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379
};

const songRequestQueue = new Queue("song-requests", { connection });

module.exports = songRequestQueue;
