/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                accent: {
                    DEFAULT: '#2C7A7B',
                    light: '#E6FFFA',
                    dark: '#234E52',
                },
                highlight: {
                    DEFAULT: '#D69E2E',
                    soft: '#FAF5FF',
                },
                bg: {
                    primary: '#FDFBF7',
                    secondary: '#F5F2EB',
                }
            },
            fontFamily: {
                heading: ['Merriweather', 'serif'],
                body: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
