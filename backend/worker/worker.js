require("dotenv").config();
const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const runBeatsourceFlow = require("./beatsourceClient");
const Request = require("../models/Request");

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379
};

async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Worker MongoDB connected");
}

async function startWorker() {
  await connectDB();

  const worker = new Worker(
    "beatsource",
    async (job) => {
      console.log("Processing job", job.id, job.data);

      const request = await Request.findById(job.data.requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // if (request.status !== "paid") {
      //   throw new Error(
      //     `Request status must be 'paid'. Got ${request.status}`
      //   );
      // }

      await Request.updateOne(
        { _id: request._id },
        { status: "processing" }
      );

      try {
        const result = await runBeatsourceFlow(request);

        await Request.updateOne(
          { _id: request._id },
          {
            status: "completed",
            beatSourceTrackId: result.trackId || null,
            resultUrl: result.url || null
          }
        );

        console.log("Job completed", job.id);
      } catch (err) {
        console.error("Job failed", job.id, err.message);
        await Request.updateOne(
          { _id: request._id },
          { status: "failed" }
        );
        throw err; // let BullMQ mark as failed
      }
    },
    { connection, concurrency: 1 }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed`, err);
  });
}

startWorker().catch((err) => {
  console.error("Worker startup failed", err);
  process.exit(1);
});