/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['child_process'] = path.resolve(__dirname, './mocks/child_process.js');
    }
    return config;
  },
};

module.exports = nextConfig;
