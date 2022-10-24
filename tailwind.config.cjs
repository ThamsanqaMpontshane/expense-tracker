/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/*.handlebars",
    "./public/*.js",
    "./public/*.css",
    "./public/*.html",
    "./public/*.json",
    
  ],
  theme: {
    screens: {
      'sm': {'min': '320px', 'max': '640px'},
      'md': {'min': '768px', 'max': '1023px'},
      'lg': {'min': '1024px', 'max': '1279px'},
      'xl': {'min': '1280px', 'max': '1535px'},
      '2xl': {'min': '1536px'},
    },
    extend: {
      colors: {
        "primary": "#1a202c",
        "secondary": "#2d3748",
        "accent": "#ed8936",
        "muted": "#e2e8f0",
        "success": "#9ae6b4",
        "info": "#63b3ed",
        "warning": "#faf089",
        "danger": "#feb2b2",
        "light": "#f7fafc",
        "dark": "#1a202c"
      }
    },
  },
  container: {
    center: true,
    padding: "1rem"
  },
  daisyui:{
    themes: ["light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter"],
  },
  variants: {},
  plugins: [require("daisyui")],
}

