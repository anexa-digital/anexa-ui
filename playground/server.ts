// The playground: every component of the kit, in the skin, mode, density and layout chosen live.
//   bun run playground            (http://localhost:5190)
// bunfig.toml enables bun-plugin-tailwind for the HTML import, as an app's does. Bun's HMR stays off: its module
// emulation breaks circular imports inside @tanstack/router-core (the apps do the same).
import index from "./index.html";

const port = Number(process.env.PORT ?? 5190);
const sample = Bun.file(new URL("./frame-sample.html", import.meta.url));
Bun.serve({ port, routes: { "/frame-sample.html": () => new Response(sample, { headers: { "content-type": "text/html; charset=utf-8" } }), "/*": index }, development: process.env.NODE_ENV === "production" ? false : { hmr: false, console: true } });
console.log(`Anexa UI playground on http://localhost:${port}/`);
