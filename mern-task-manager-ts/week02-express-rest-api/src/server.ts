/**
 * Author: Bill Chen
 * Project: MERN Task Manager
 * Week: Week 02
 * File: src/server.ts
 *
 * The server entry point. All it does is build the Express app and listen
 * on a port. Keeping this file tiny means src/app.ts stays test-friendly.
 */
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console -- intentional startup log
  console.log(`Week 2 server listening on http://localhost:${port}`);
});
