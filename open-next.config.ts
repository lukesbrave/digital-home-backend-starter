import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

// Override OpenNext's default invocation of `npm run build`. Without this,
// `opennextjs-cloudflare build` recursively re-invokes the project's build
// script (which itself calls `opennextjs-cloudflare build`) and infinite-loops.
// See @opennextjs/aws/dist/build/buildNextApp.js.
config.buildCommand = "next build";

export default config;
