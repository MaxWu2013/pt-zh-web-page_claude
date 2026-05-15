import React, { useEffect } from 'react';
import ErrorBoundary from './common/ErrorBoundary/ErrorBoundary';
import Toast from './common/Toast/Toast';
import { BlockingModal, NonBlockingModal } from './components/Modal/Modal';
import { GlobalContextProvider } from './context/GlobalContext';
import ola from './ola';
import Router from './router';
import ReactQueryProvider from '/src/context/ReactQueryProvider/ReactQueryProvider';
import { activity_id } from '/src/common/constant';

const env = {
	lan: ola.user.lan,
	uid: ola.user.uid,
	appName: ola.app.config.appName,
	serverEnv: ola.app.server_env,
};
const needConsole = window.location.href.includes('console');

const ReactQueryDevtoolsProduction = React.lazy(() =>
	import('@tanstack/react-query-devtools/build/lib/index.prod.js').then((d) => ({
		default: d.ReactQueryDevtools,
	})),
);

// eslint-disable-next-line import/prefer-default-export
export function App() {
	useEffect(() => {
		window.ta.track('event_participate', {
			uid: ola.user.uid,
			id: activity_id,
			env: ola.app.server_env,
		});
	}, []);
	return (
		<ErrorBoundary env={env}>
			<Toast />
			<ReactQueryProvider>
				<GlobalContextProvider>
					<Router />
					<NonBlockingModal />
					<BlockingModal />
				</GlobalContextProvider>
				{needConsole && (
					<React.Suspense fallback={null}>
						<ReactQueryDevtoolsProduction />
					</React.Suspense>
				)}
			</ReactQueryProvider>
		</ErrorBoundary>
	);
}
