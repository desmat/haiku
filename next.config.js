/** @type {import('next').NextConfig} */
const nextConfig = {
    // experimental: {
    //     serverActions: false,
    // },
    env: {
        AUTH_PRIVATE_KEY: process.env.AUTH_PRIVATE_KEY,
        AUTH_PUBLIC_KEY: process.env.AUTH_PUBLIC_KEY,
        ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
        FB_APP_ID: process.env.FB_APP_ID,
        EXPERIENCE_MODE: process.env.EXPERIENCE_MODE,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        SESSION_ENCODE: process.env.SESSION_ENCODE,
        ONBOARDING_USER_ID: process.env.ONBOARDING_USER_ID,
    }
}

module.exports = nextConfig
