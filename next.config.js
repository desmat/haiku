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
        BACKGROUND_BLUR: process.env.BACKGROUND_BLUR,
    }
}

module.exports = nextConfig
