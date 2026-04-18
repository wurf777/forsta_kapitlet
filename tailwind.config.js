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
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseOnce: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.6' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'pulse-once': 'pulseOnce 0.6s ease-in-out 1',
            },
        },
    },
    plugins: [],
}
