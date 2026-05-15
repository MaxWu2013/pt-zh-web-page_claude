/**
 * Detect Android/iOS hardware back-button (or browser-back) navigation by
 * listening to `window.popstate`.
 *
 * Use this when you need to react to a back press — typical cases:
 *   - show a "Leave activity?" confirm dialog before exiting the page,
 *   - close an open modal/sheet first instead of leaving the page,
 *   - pop a custom history stack (e.g. tab navigation inside one route).
 *
 * Step-by-step:
 *
 *   1. Define a callback in your page component. It should return `boolean`:
 *
 *        const handleBack = useCallback((): boolean => {
 *          if (modalOpen) {
 *            setModalOpen(false);
 *            return false; // optional — see note below
 *          }
 *          return true;
 *        }, [modalOpen]);
 *
 *   2. Call the hook at the top of the component body:
 *
 *        useBackButtonDetection(handleBack);
 *
 *   3. Wrap the callback in `useCallback` (with a correct dep array) so the
 *      effect doesn't tear down and re-add the listener on every render.
 *
 * Note on blocking navigation:
 *   The current implementation does NOT consume the boolean return — the
 *   browser always proceeds with the back navigation. If you need to *block*
 *   the back press (e.g. keep the user on the page until they dismiss a
 *   dialog), push a duplicate state entry inside `handlePopState`:
 *
 *        window.history.pushState(null, '', window.location.href);
 *
 *   so the next back press has somewhere to pop to.
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type BoolCallback = () => boolean;

const useBackButtonDetection = (onBackButtonEvent: BoolCallback) => {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		function handlePopState() {
			onBackButtonEvent();
		}

		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, [location, navigate, onBackButtonEvent]);
};

export default useBackButtonDetection;
