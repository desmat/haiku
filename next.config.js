/** @type {import('next').NextConfig} */
const nextConfig = {
    // experimental: {
    //     serverActions: false,
    // },
    env: {
        AUTH_PRIVATE_KEY: process.env.AUTH_PRIVATE_KEY,
        AUTH_PUBLIC_KEY: process.env.AUTH_PUBLIC_KEY,
    }
}

module.exports = nextConfig
