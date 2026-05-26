import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
				port: '',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'avatars.githubusercontent.com',
				port: '',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'static-cdn.jtvnw.net',
				port: '',
				pathname: '/**'
			}
		]
	}
}

export default nextConfig
