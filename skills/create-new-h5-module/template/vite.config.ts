import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import postcssPX2viewport from 'postcss-px-to-viewport';
import { babelPluginZhReplacer } from '@ola/zh-scanner';
import babelPluginReactScopedCSS from '@ola/babel-plugin-react-scoped-css';
import rollupPluginScopedCSS from '@ola/rollup-plugin-scoped-css';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';
import * as path from 'path';
import UnoCSS from 'unocss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

function genBase() {
	const $ = (cmd: string) => execSync(cmd, { encoding: 'utf-8' });
	const repositoryPath = $('dirname `git rev-parse --git-dir`').trim();
	const base = __dirname.replace(repositoryPath, '');
	return `${base}/`;
}

// https://vitejs.dev/config/
export default defineConfig({
	base: genBase(),
	resolve: {
		alias: {
			'@src': path.resolve(__dirname, './src'),
			'/src': path.resolve(__dirname, './src'),
		},
	},
	assetsInclude: ['**/*.svga'],
	define: {
		__SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN || ''), // set in CI environment
	},
	build: {
		sourcemap: true, // Source map generation
	},
	plugins: [
		// Redirect base-path-without-trailing-slash → base-path-with-trailing-slash.
		// Avoids a 404 when someone visits the module URL without the trailing
		// slash during development.
		{
			name: 'redirect-no-trailing-slash',
			configureServer(server) {
				const base = genBase();
				const noSlash = base.slice(0, -1);
				server.middlewares.use((req, res, next) => {
					if (req.url === noSlash || req.url?.startsWith(noSlash + '?')) {
						res.writeHead(302, { Location: base });
						res.end();
					} else {
						next();
					}
				});
			},
		},
		react({
			babel: {
				plugins: [babelPluginReactScopedCSS, babelPluginZhReplacer],
			},
		}),
		rollupPluginScopedCSS(),
		legacy({ targets: ['iOS 11', 'Android 4.4'], modernPolyfills: true }),
		UnoCSS(),
		sentryVitePlugin({
			url: 'https://sentry.partying.cloud/',
			authToken: process.env.SENTRY_AUTH_TOKEN, // set in CI environment
			org: 'sentry',
			project: process.env.SENTRY_PROJECT, // set in CI environment
			sourcemaps: {
				filesToDeleteAfterUpload: '**/*.map', // remove all source map files after upload to sentry, to prevent leakage of source code
			},
		}),
	],
	server: {
		host: '0.0.0.0',
		proxy: {
			'/vite/proxy': {
				target: 'https://api.yinjietd.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/vite\/proxy/, ''),
			},
		},
	},
	css: {
		postcss: {
			plugins: [
				postcssPX2viewport({
					unitToConvert: 'px',
					viewportWidth: 375,
					unitPrecision: 5,
					propList: ['*'],
					viewportUnit: 'vw',
					fontViewportUnit: 'vw',
					selectorBlackList: [],
					minPixelValue: 1,
					mediaQuery: false,
					replace: true,
					exclude: undefined,
					include: undefined,
					landscape: false,
					landscapeUnit: 'vw',
					landscapeWidth: 568,
				}),
			],
		},
	},
});
