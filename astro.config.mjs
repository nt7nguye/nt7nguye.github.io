import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://nt7nguye.com",
  integrations: [mdx()],
  markdown: {
    shikiConfig: { themes: { light: "github-light", dark: "github-dark" } },
  },
});
