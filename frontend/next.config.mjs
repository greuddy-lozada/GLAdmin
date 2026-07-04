import { withSerwist } from '@serwist/turbopack';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
};

export default withSerwist(nextConfig);
