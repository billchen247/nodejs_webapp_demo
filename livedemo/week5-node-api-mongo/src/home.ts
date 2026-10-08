const homePage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#101827">
    <meta name="description" content="A learning guide to this Node.js, Express, TypeScript, and MongoDB REST API project.">
    <title>Node + Express API | Learning Hub</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #182338;
        background: #f5f7fb;
        font-synthesis: none;
        text-rendering: optimizeLegibility;
      }
      * { box-sizing: border-box; }
      body { margin: 0; }
      a { color: inherit; }
      .topbar { background: #101827; color: #dbe5f4; }
      .nav, main, footer { width: min(1100px, calc(100% - 40px)); margin: 0 auto; }
      .nav { min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
      .brand { color: #fff; font-weight: 750; letter-spacing: -.03em; text-decoration: none; }
      .nav-links { display: flex; gap: 24px; font-size: .9rem; }
      .nav-links a { color: #c4d0e1; text-decoration: none; }
      .nav-links a:hover { color: #fff; }
      .hero { padding: 76px 0 68px; color: #f5f8ff; background: radial-gradient(ellipse at 78% 0%, #294d78 0%, transparent 48%), linear-gradient(130deg, #101827, #172a43); }
      .hero-inner { width: min(1100px, calc(100% - 40px)); margin: 0 auto; display: grid; grid-template-columns: 1.2fr .8fr; align-items: center; gap: 56px; }
      .eyebrow { margin: 0 0 16px; color: #86e4ce; font-size: .76rem; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; }
      h1 { max-width: 650px; margin: 0; font-size: clamp(2.5rem, 6vw, 4.7rem); line-height: 1.02; letter-spacing: -.065em; }
      .hero-copy { max-width: 620px; margin: 22px 0 28px; color: #c5d2e3; font-size: 1.08rem; line-height: 1.75; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; }
      .button { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 18px; border: 1px solid transparent; border-radius: 10px; font-weight: 750; text-decoration: none; transition: transform .15s ease, background .15s ease; }
      .button:hover { transform: translateY(-2px); }
      .button-primary { background: #8be2ca; color: #10251f; }
      .button-secondary { border-color: #53647a; color: #f5f8ff; }
      .terminal { overflow: hidden; border: 1px solid #34465c; border-radius: 16px; background: #0b1220; box-shadow: 0 24px 70px #050a1452; }
      .terminal-head { display: flex; align-items: center; gap: 7px; padding: 13px 16px; border-bottom: 1px solid #253349; }
      .dot { width: 9px; height: 9px; border-radius: 50%; background: #fb7185; }
      .dot:nth-child(2) { background: #fbbf24; }
      .dot:nth-child(3) { background: #4ade80; }
      .terminal-label { margin-left: auto; color: #8695aa; font-size: .74rem; }
      .terminal pre { overflow-x: auto; margin: 0; padding: 22px; color: #c9d7eb; font: .85rem/1.9 ui-monospace, SFMono-Regular, Menlo, monospace; }
      .terminal .comment { color: #7f91a9; }
      .terminal .key { color: #8be2ca; }
      main { padding: 64px 0 76px; }
      .section-head { max-width: 680px; margin-bottom: 26px; }
      .section-label { margin: 0 0 9px; color: #5477a6; font-size: .75rem; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; }
      h2 { margin: 0; color: #17243a; font-size: clamp(1.8rem, 4vw, 2.5rem); letter-spacing: -.045em; }
      .section-copy { margin: 12px 0 0; color: #5b687d; line-height: 1.7; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .card { padding: 22px; border: 1px solid #e1e7f0; border-radius: 14px; background: #fff; box-shadow: 0 5px 18px #1f35500a; }
      .card-number { display: inline-flex; width: 32px; height: 32px; align-items: center; justify-content: center; border-radius: 9px; background: #e9f7f3; color: #18755f; font-size: .8rem; font-weight: 850; }
      h3 { margin: 15px 0 8px; color: #17243a; font-size: 1.06rem; }
      .card p { margin: 0; color: #5b687d; font-size: .92rem; line-height: 1.65; }
      code { padding: 2px 5px; border-radius: 5px; background: #eff3f8; color: #264c75; font: .88em ui-monospace, SFMono-Regular, Menlo, monospace; }
      .routes { display: grid; gap: 10px; }
      .route { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 16px; padding: 16px 18px; border: 1px solid #e1e7f0; border-radius: 12px; background: #fff; text-decoration: none; }
      .route:hover { border-color: #8bbcae; box-shadow: 0 5px 20px #1f35500d; }
      .method { padding: 5px 8px; border-radius: 6px; background: #e8f7f1; color: #177458; font-size: .68rem; font-weight: 900; letter-spacing: .06em; }
      .route-path { font: 750 .9rem ui-monospace, SFMono-Regular, Menlo, monospace; }
      .route-desc { margin-top: 5px; color: #667389; font-size: .82rem; }
      .route-arrow { color: #74849a; font-size: 1.2rem; }
      .note { margin-top: 15px; padding: 14px 16px; border-left: 3px solid #80cbb6; border-radius: 0 8px 8px 0; background: #eaf6f2; color: #425d56; font-size: .9rem; line-height: 1.6; }
      .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .step { padding: 20px; border-radius: 14px; background: #172a43; color: #eef4fc; }
      .step small { color: #8be2ca; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      .step h3 { color: #fff; }
      .step p { color: #bdcadd; font-size: .9rem; line-height: 1.65; }
      .step code { display: inline-block; margin-top: 5px; background: #0d1829; color: #b9e9d9; }
      .resources { display: flex; flex-wrap: wrap; gap: 12px; }
      .resource { padding: 11px 14px; border: 1px solid #dce4ee; border-radius: 9px; background: #fff; color: #294969; font-size: .9rem; font-weight: 700; text-decoration: none; }
      .resource:hover { border-color: #8bbcae; }
      section + section { margin-top: 64px; }
      footer { padding: 24px 0 34px; border-top: 1px solid #e0e6ef; color: #708096; font-size: .84rem; }
      @media (max-width: 760px) {
        .hero-inner { grid-template-columns: 1fr; gap: 32px; }
        .hero { padding: 54px 0; }
        .grid, .steps { grid-template-columns: 1fr; }
        .nav-links { gap: 13px; font-size: .82rem; }
        .nav { min-height: 62px; }
      }
      @media (max-width: 480px) {
        .nav, main, footer, .hero-inner { width: min(100% - 28px, 1100px); }
        .nav-links a:first-child { display: none; }
        .route { grid-template-columns: auto minmax(0, 1fr); gap: 10px; }
        .route-arrow { display: none; }
      }
    </style>
  </head>
  <body>
    <header class="topbar">
      <nav class="nav" aria-label="Main navigation">
        <a class="brand" href="/">NODE / EXPRESS LAB</a>
        <div class="nav-links">
          <a href="#learn">Learn</a>
          <a href="#endpoints">API routes</a>
          <a href="#run">Run locally</a>
          <a href="/api-docs">Swagger UI</a>
        </div>
      </nav>
    </header>
    <section class="hero">
      <div class="hero-inner">
        <div>
          <p class="eyebrow">A hands-on learning project</p>
          <h1>Build your first REST API.</h1>
          <p class="hero-copy">Explore how Node.js, Express, TypeScript, and MongoDB fit together in a small API. Follow the request from route to response, try the endpoints, and use the docs as your guide.</p>
          <div class="actions">
            <a class="button button-primary" href="/api-docs">Explore the API <span aria-hidden="true">&nbsp;→</span></a>
            <a class="button button-secondary" href="#learn">Start learning</a>
          </div>
        </div>
        <div class="terminal" aria-label="Example API request">
          <div class="terminal-head"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="terminal-label">request → response</span></div>
          <pre><span class="comment"># Ask the API for its emoji list</span>
GET <span class="key">/api/v1/emojis</span>
Accept: application/json

<span class="comment"># A JSON response</span>
200 OK
["😀", "😳", "🙄"]</pre>
        </div>
      </div>
    </section>
    <main>
      <section id="learn">
        <div class="section-head">
          <p class="section-label">The building blocks</p>
          <h2>What you’ll learn here</h2>
          <p class="section-copy">This project keeps the moving parts small so you can see how an HTTP request becomes a JSON response.</p>
        </div>
        <div class="grid">
          <article class="card"><span class="card-number">01</span><h3>Node.js + TypeScript</h3><p>Run JavaScript on the server, then use TypeScript types to make request handlers and API data easier to understand.</p></article>
          <article class="card"><span class="card-number">02</span><h3>Express routes</h3><p>Map HTTP methods and URL paths to handlers. Middleware such as logging, CORS, JSON parsing, and error handling surrounds those routes.</p></article>
          <article class="card"><span class="card-number">03</span><h3>MongoDB connection</h3><p>Mongoose connects the app to MongoDB when the server starts. The sample emoji endpoint is intentionally static; it is not yet stored in the database.</p></article>
        </div>
        <div class="note"><strong>Request flow:</strong> browser or client → Express middleware → matching route → JSON response. MongoDB is connected during startup and is ready for future model-backed routes.</div>
      </section>
      <section id="endpoints">
        <div class="section-head">
          <p class="section-label">Try a route</p>
          <h2>API endpoints</h2>
          <p class="section-copy">Open an endpoint directly, or use Swagger UI to inspect the contract and send requests from your browser.</p>
        </div>
        <div class="routes">
          <a class="route" href="/api/v1"><span class="method">GET</span><span><span class="route-path">/api/v1</span><div class="route-desc">A simple API welcome response</div></span><span class="route-arrow" aria-hidden="true">↗</span></a>
          <a class="route" href="/api/v1/emojis"><span class="method">GET</span><span><span class="route-path">/api/v1/emojis</span><div class="route-desc">A sample JSON array of emojis</div></span><span class="route-arrow" aria-hidden="true">↗</span></a>
          <a class="route" href="/api-docs"><span class="method">DOCS</span><span><span class="route-path">/api-docs</span><div class="route-desc">Interactive Swagger UI and OpenAPI specification</div></span><span class="route-arrow" aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section id="run">
        <div class="section-head">
          <p class="section-label">Get started</p>
          <h2>Run it on your machine</h2>
          <p class="section-copy">Start MongoDB first, configure the connection string, then launch the development server.</p>
        </div>
        <div class="steps">
          <article class="step"><small>Step 1</small><h3>Install dependencies</h3><p>From the project folder, install the packages with:</p><code>pnpm install</code></article>
          <article class="step"><small>Step 2</small><h3>Configure MongoDB</h3><p>Set <code>MONGODB_URI</code> in your <code>.env</code> file. The default local URI is documented in the README.</p></article>
          <article class="step"><small>Step 3</small><h3>Start the API</h3><p>Run the development server and open this page or Swagger UI:</p><code>pnpm run dev</code></article>
        </div>
      </section>
      <section>
        <div class="section-head">
          <p class="section-label">Keep exploring</p>
          <h2>Project resources</h2>
        </div>
        <div class="resources">
          <a class="resource" href="/api-docs">Swagger UI →</a>
          <a class="resource" href="/api-docs/openapi.json">OpenAPI JSON →</a>
          <a class="resource" href="https://expressjs.com/en/guide/routing.html" target="_blank" rel="noreferrer">Express routing guide ↗</a>
          <a class="resource" href="https://mongoosejs.com/docs/" target="_blank" rel="noreferrer">Mongoose docs ↗</a>
        </div>
      </section>
    </main>
    <footer>Learning project · Node.js · Express · TypeScript · MongoDB</footer>
  </body>
</html>`;

export default homePage;
