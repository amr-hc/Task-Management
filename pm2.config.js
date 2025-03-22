module.exports = {
    apps: [
      {
        name: "api",
        script: "dist/server.js",
      },
      {
        name: "notification-worker",
        script: "dist/jobs/notificationProcessor.js",
      },
    ],
  };
  