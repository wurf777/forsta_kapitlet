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
                    DEFAULT: '#2B6F70',
                    light: '#DBEFEB',
                    dark: '#1F5657',
                },
                highlight: {
                    DEFAULT: '#C58A3A',
                    soft: '#F8F0E4',
                },
                warm: {
                    DEFAULT: '#C16B4F',
                    light: '#F6E3D9',
                    dark: '#A6553B',
                },
                bg: {
                    primary: '#FDFBF7',
                    secondary: '#F3ECE2',
                    card: '#FAF7F2',
                    muted: '#EFE7DB',
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
