import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loading from './common/Loading/Loading';

const Home = lazy(() => import('/src/pages/Home/Home'));

const NavigateWithQuery = ({ to }: { to: string }) => {
	const [searchParams] = useSearchParams();
	let newTo = to;
	if (searchParams.toString() !== '') {
		// Preserve the current query parameters
		const separator = to.includes('?') ? '&' : '?';
		newTo = `${to}${separator}${searchParams.toString()}`;
	}

	return <Navigate to={newTo} replace />;
};
export const RouteConfig = {
	HOME: 'home',
	RULE: 'rule',
	joinRouteUrl: function (...routeUrls: string[]) {
		return '/' + routeUrls.join('/');
	},
};
// eslint-disable-next-line react/display-name
export default () => {
	const { HOME, RULE, joinRouteUrl } = RouteConfig;
	return (
		<Suspense fallback={<Loading style={{ height: '100vh' }} />}>
			<BrowserRouter basename={import.meta.env.BASE_URL}>
				<Routes>
					<Route path="/" element={<NavigateWithQuery to={joinRouteUrl(HOME)} />} />
					<Route path={joinRouteUrl(HOME)} element={<Home />} />
					<Route path="/*" element={<NavigateWithQuery to={joinRouteUrl(HOME)} />} />
				</Routes>
			</BrowserRouter>
		</Suspense>
	);
};
