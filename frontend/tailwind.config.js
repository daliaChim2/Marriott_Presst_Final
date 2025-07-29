module.exports = {
  theme: {
    extend: {
      colors: {
        marriottpresst  : '#4B3CFA', 
      },
    },
  },
  // tener el content configurado
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
};
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        dropdown: "fadeSlideIn 0.3s ease-out forwards",
      },
      keyframes: {
        fadeSlideIn: {
          "0%": { opacity: 0, transform: "translateY(-10px) scale(0.95)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
