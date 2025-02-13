import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/forms'),
  ],
  daisyui: {
    themes: ["light", "dark", "retro",
      {
        gruvbox: {
          primary: "#fabd2f", // Gruvbox yellow
          secondary: "#8ec07c", // Gruvbox green
          accent: "#fb4934", // Gruvbox red
          neutral: "#282828", // Gruvbox background
          "base-100": "#3c3836", // Gruvbox dark gray
          info: "#83a598", // Gruvbox blue
          success: "#b8bb26", // Gruvbox green
          warning: "#fe8019", // Gruvbox orange
          error: "#fb4934", // Gruvbox red
        },
      },
    ],
    darkTheme: "dark", // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
    themeRoot: ":root"
  },
} satisfies Config;
