const redis = require("redis");
const config = require("./config");

const client = redis.createClient({
  password: config.REDISPASSWORD,
  socket: {
    host: "redis-13597.c331.us-west1-1.gce.redns.redis-cloud.com",
    port: 13597,
  },
});

client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

module.exports = client;
