/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f5ff',
                    100: '#e0ebff',
                    200: '#c7d9ff',
                    300: '#a4c1ff',
                    400: '#7a9eff',
                    500: '#5b7cfa',
                    600: '#4859f0',
                    700: '#3d45dc',
                    800: '#343ab2',
                    900: '#30358c',
                    950: '#1e2150',
                },
                surface: {
                    50: '#fefefe',
                    100: '#f8f9fc',
                    200: '#f1f3f9',
                    300: '#e8ebf4',
                    400: '#d8dce9',
                    500: '#c4c9db',
                    600: '#9ea4bd',
                    700: '#6b7280',
                    800: '#4b5563',
                    900: '#374151',
                },
                // Keep dark for backwards compatibility
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s infinite',
                'float': 'float 3s ease-in-out infinite',
                'gradient': 'gradientShift 3s ease infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                gradientShift: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },
            boxShadow: {
                'glow': '0 0 20px rgba(91, 124, 250, 0.15)',
                'glow-lg': '0 0 40px rgba(91, 124, 250, 0.25)',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
        },
    },
    plugins: [],
}
