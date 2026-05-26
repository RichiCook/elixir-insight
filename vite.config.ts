import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/** Inject CSP meta tag into production builds only (dev needs inline scripts for HMR). */
function cspPlugin(): Plugin {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: data: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return {
    name: "html-csp",
    transformIndexHtml(html) {
      return html.replace(
        "<head>",
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`
      );
    },
    apply: "build",
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    cspPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/") ||
            id.includes("node_modules/scheduler/")
          )
            return "vendor-react";
          if (
            id.includes("node_modules/recharts/") ||
            id.includes("node_modules/d3-") ||
            id.includes("node_modules/victory-vendor/")
          )
            return "vendor-charts";
          if (id.includes("node_modules/framer-motion/"))
            return "vendor-animation";
          if (
            id.includes("node_modules/@radix-ui/") ||
            id.includes("node_modules/lucide-react/")
          )
            return "vendor-ui";
          if (
            id.includes("node_modules/@supabase/") ||
            id.includes("node_modules/@tanstack/") ||
            id.includes("node_modules/zustand/")
          )
            return "vendor-data";
        },
      },
    },
  },
}));
