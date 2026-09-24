/* ---------------------------------------------------------------------------
 * src/middleware/body.js
 *
 * Reads and JSON-parses the request body. This is the Node.js equivalent of
 * `app.use(express.json())` — without Express we have to consume the stream
 * ourselves.
 *
 * Why the request body is a stream
 * --------------------------------
 * HTTP bodies can be arbitrarily large. Node.js does not buffer them into
 * memory for you; instead it exposes `req` as a Node readable stream that
 * emits "data" events as chunks arrive:
 *
 *      request
 *         |
 *         +--> "data" chunk
 *         +--> "data" chunk
 *         +--> "data" chunk
 *         |
 *         +--> "end"
 *         |
 *         v
 *   Buffer.concat(...).toString("utf8")
 *         |
 *         v
 *      JSON.parse(...)
 *
 * We collect Buffer chunks first (rather than concatenating strings) because
 * a single UTF-8 character can be split across two chunks; only combining
 * the raw bytes and THEN decoding avoids the "half a character" problem.
 * @author Bill Chen
 * -------------------------------------------------------------------------*/

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        req.on("data", (chunk) => chunks.push(chunk));

        req.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8");

            // Empty body is legal — e.g. a PUT that just wants to toggle a
            // boolean might send nothing. Return an empty object rather than
            // crashing JSON.parse.
            if (raw === "") return resolve({});

            try {
                resolve(JSON.parse(raw));
            } catch {
                // The client sent something that isn't valid JSON. We tag
                // the error so the controller can turn it into a clean 400.
                const err = new Error("Invalid JSON body");
                err.code = "INVALID_JSON";
                reject(err);
            }
        });

        // Without an "error" listener, a broken connection would crash the
        // entire Node process.
        req.on("error", reject);
    });
}

module.exports = { readRequestBody };
