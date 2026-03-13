/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FFF2E1",
                accent: "#A79277",
                dark: "#3A3A3A",
                hover: "#8C6F56",
                "accent-light": "#C4A882",
                "primary-dark": "#F5E6D0",
                danger: "#E74C3C",
                success: "#27AE60",
                warning: "#F39C12",
            },
            fontFamily: {
                sans: ["'Inter'", "system-ui", "sans-serif"],
                display: ["'Outfit'", "system-ui", "sans-serif"],
            },
            boxShadow: {
                "glass": "0 8px 32px rgba(0, 0, 0, 0.08)",
                "glass-lg": "0 16px 48px rgba(0, 0, 0, 0.12)",
                "card": "0 2px 16px rgba(167, 146, 119, 0.15)",
                "card-hover": "0 8px 32px rgba(167, 146, 119, 0.25)",
            },
            animation: {
                "fade-in": "fadeIn 0.6s ease-out",
                "slide-up": "slideUp 0.6s ease-out",
                "pulse-slow": "pulse 3s infinite",
                "float": "float 6s ease-in-out infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
            },
        },
    },
    plugins: [],
}
