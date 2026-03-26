import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
// rebuild trigger
// env fix
