import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* theme-aware tokens (see app/globals.css :root / [data-theme="light"]) */
        ink: {
          950: "rgb(var(--ink-950) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
        },
        line: "var(--line)",
        linesoft: "var(--line-soft)",
        fog: {
          DEFAULT: "rgb(var(--fog) / <alpha-value>)",
          dim: "rgb(var(--fog-dim) / <alpha-value>)",
          muted: "rgb(var(--fog-muted) / <alpha-value>)",
        },
        /* foreground accent: white on dark, near-black on paper */
        fg: "rgb(var(--fg) / <alpha-value>)",
        /* panel/card surface per section scope */
        card: "rgb(var(--card) / <alpha-value>)",
        /* image scrim base: black on dark, paper on light */
        scrim: "rgb(var(--scrim) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      letterSpacing: { tech: "0.18em", tightish: "-0.02em", tighterish: "-0.04em" },
      maxWidth: { shell: "1440px" },
      transitionTimingFunction: { expo: "cubic-bezier(0.16, 1, 0.3, 1)" },
    },
  },
  plugins: [],
};
export default config;
