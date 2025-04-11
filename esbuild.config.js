import esbuild from "esbuild"

esbuild
  .build({
    entryPoints: ["src/index.jsx"],
    bundle: true,
    minify: true,
    sourcemap: true,
    format: "esm",
    outfile: "dist/index.js",
    target: ["esnext"],
    external: ["react", "react-dom"], // Keep peer dependencies external
    loader: {
      ".js": "jsx",
    },
  })
  .catch(() => process.exit(1))
