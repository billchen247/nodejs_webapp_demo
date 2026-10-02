/**
 * @file src/server.js
 * @author Bill Chen
 * @description Week 2 — Express entry point.
 *
 * Express is a small, popular Node.js framework for HTTP servers. It gives
 * us routing, middleware, body parsing, and a tidy API that is far nicer
 * than the raw `http` module we used in Week 1.
 *
 * This file only *starts* the app. The app itself is built in `app.js`,
 * which keeps it independent of the port and makes unit testing easy.
 */
import { createApp } from "./app.js";

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Week 2 server listening on http://localhost:${PORT}`);
});
