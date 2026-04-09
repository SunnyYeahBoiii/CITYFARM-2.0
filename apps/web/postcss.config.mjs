/**
 * Tailwind CSS v4 + Next.js: chỉ cần plugin PostCSS chính thức.
 * Cấu hình theme / content: ưu tiên globals.css (@import "tailwindcss", @source, @theme).
 * @see https://tailwindcss.com/docs/installation/using-postcss
 *
 * @type {import('postcss-load-config').Config}
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
