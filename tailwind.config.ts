import type { Config } from 'tailwindcss';

// Note: In Tailwind CSS v4, most configuration is done via CSS @theme and
// @custom-variant directives in globals.css. This file is kept for compatibility.
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Dark mode is configured via @custom-variant in globals.css
  darkMode: 'class',
};

export default config;
