/**
 * Drop-in replacement for `useNavigate` that preserves the current URL's
 * query string when navigating to another route in this module.
 *
 * Why this exists:
 *   H5 pages in this monorepo carry critical context in the URL:
 *     - `?lan=zh_tw|zh_cn|en` — drives the runtime locale lookup in
 *       `src/common/setLocale.ts` (see also `src/locale/`),
 *     - tracking IDs from the app's native bridge (`from`, `act_id`, etc.),
 *     - debug toggles (e.g. `vconsole=1`).
 *   A plain `useNavigate('/rule')` would DROP all of those, breaking
 *   translations and analytics on the destination page.
 *
 * Step-by-step:
 *
 *   1. Import and call the hook in your component:
 *
 *        import useNavigateWithQuery from '/src/hooks/useNavigateWithQuery';
 *        const navigate = useNavigateWithQuery();
 *
 *   2. Use it exactly like react-router-dom's `useNavigate`:
 *
 *        <button onClick={() => navigate('/rule')}>Rules</button>
 *        // → ends up at `/rule?lan=zh_tw&from=app&...`
 *
 *      Options forward unchanged:
 *
 *        navigate('/rule', { replace: true });
 *
 *   3. The hook concatenates the existing query string onto your target
 *      path. If `path` already contains its own `?` (e.g. `/rule?tab=2`),
 *      the join uses `&` instead, so you never double-`?`.
 *
 * When NOT to use this:
 *   - Navigating to a different module/site (`window.location.href = ...`),
 *     because the destination's query semantics are different.
 *   - Navigating to a native deeplink (e.g. `partying://...`) — the bridge
 *     parses URLs differently and may reject extra params.
 *   In those cases use plain `useNavigate` or `window.location.href`.
 */
import { useNavigate, useSearchParams } from "react-router-dom";

const useNavigateWithQuery = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const customNavigate = (path: string, options = {}) => {
    let newPath = path;
    if (searchParams.toString() !== "") {
      // Preserve the current query parameters
      const separator = path.includes("?") ? "&" : "?";
      newPath = `${path}${separator}${searchParams.toString()}`;
    }

    // Navigate to the new path with the query parameters
    navigate(newPath, options);
  };

  return customNavigate;
};

export default useNavigateWithQuery;
