/** @type {import('next').NextConfig} */
const nextConfig = {
    // experimental: {
    //     serverActions: false,
    // },
    env: {
        AUTH_PRIVATE_KEY: process.env.AUTH_PRIVATE_KEY,
        AUTH_PUBLIC_KEY: process.env.AUTH_PUBLIC_KEY,
        EXPERIENCE_MODE: process.env.EXPERIENCE_MODE,
        ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
        FB_APP_ID: process.env.FB_APP_ID,
    }
}

module.exports = nextConfig
