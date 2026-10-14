// Tailwind v4 runs through Astro's built-in PostCSS pipeline (src/index.css imports "tailwindcss").
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
