// TODO: fill from guide
const backend = process.env.BACKEND_URL || "http://backend:8000";

export default {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};