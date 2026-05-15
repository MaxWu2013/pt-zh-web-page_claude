import * as Sentry from '@sentry/react';
import { NativeError } from '/src/native';

// Injected by vite at build time
declare const __SENTRY_DSN__: string;

const isInProduction =
	window.location.origin.includes('.histar.chat') ||
	window.location.origin.includes('.partying.tw') ||
	window.location.origin.includes('.hlrn123');

export default function setSentry() {
	Sentry.init({
		dsn: __SENTRY_DSN__,
		beforeSend(event, hint) {
			const error = hint && hint.originalException;
			if (error instanceof NativeError) {
				// console.error('catch error here in beforeSend', error);
				return null;
			}
			return event;
		},
		integrations: [
			// Sentry.browserTracingIntegration(), // Web Vitals
			Sentry.replayIntegration(),
		],
		// Tracing
		// tracesSampleRate: 0.1,
		// Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
		// tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/]
		//
		// Session Replay
		replaysSessionSampleRate: 0.0,
		replaysOnErrorSampleRate: isInProduction ? 0.3 : 1.0,
		ignoreErrors: ['onReturnToWeb'],
	});
}
