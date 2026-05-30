export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          black: '#000000',
          yellow: '#FFD700',
          white: '#FFFFFF',
        },
        secondary: {
          gray: '#333333',
          light: '#F5F5F5',
        },
        accent: {
          red: '#FF4444',
          green: '#44BB44',
          blue: '#4444FF',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
