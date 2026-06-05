module.exports = {
	apps: [
		{
			name: 'eventhub-back',
			cwd: './back-nestjs',
			script: 'npm',
			args: 'run start:prod',
			env: {
				NODE_ENV: 'production'
			}
		},
		{
			name: 'eventhub-front',
			cwd: './front-nextjs',
			script: 'npm',
			args: 'run start',
			env: {
				NODE_ENV: 'production'
			}
		}
	]
}
