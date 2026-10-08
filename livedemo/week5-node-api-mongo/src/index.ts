import app from "./app.js";
import { connectDatabase } from "./db.js";
import { env } from "./env.js";

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      /* eslint-disable no-console */
      console.log(`Listening: http://localhost:${env.PORT}`);
      /* eslint-enable no-console */
    });

    server.on("error", (err) => {
      if ("code" in err && err.code === "EADDRINUSE") {
        console.error(`Port ${env.PORT} is already in use. Please choose another port or stop the process using it.`);
      }
      else {
        console.error("Failed to start server:", err);
      }
      process.exit(1);
    });
  }
  catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

void startServer();
