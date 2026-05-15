/**
 * Query key registry for @tanstack/react-query.
 *
 * Every `useQuery` / `useMutation` in this module must reference a key from
 * this file so that:
 *   - cache invalidation (e.g. `queryClient.invalidateQueries(queryKeys.HomeInfo)`)
 *     hits the right caches across all components that read the same data, and
 *   - typos in key names break compilation instead of silently creating a
 *     parallel cache with stale data.
 *
 * Naming convention:
 *   - PascalCase, matching the API function minus its verb (`GetHomeInfo` →
 *     `HomeInfo`, `GetRewardList` → `RewardList`).
 *   - Value is a single-element string array. React Query treats arrays as
 *     the canonical key shape and supports hierarchical invalidation by
 *     prefix (e.g. `['Reward']` invalidates `['Reward', 'list']` and
 *     `['Reward', 'detail', id]`).
 *
 * Adding a new key — three steps:
 *
 *   1. Define the API function in `src/service/API.ts`:
 *        export function GetHomeInfo(): Promise<HomeInfoResponse> { ... }
 *   2. Add a matching key here:
 *        HomeInfo: ['HomeInfo'],
 *   3. Create a hook in `src/hooks/ReactQuery/useHomeInfo.ts`:
 *        return useQuery(queryKeys.HomeInfo, GetHomeInfo, { select: r => r.data });
 *
 * Reference: see `tools/newbie-jump-rewards/src/hooks/ReactQuery/queryKeys.ts`
 * for an example with multiple keys.
 */
const useQueryKeys = {
	SamplePushRequest: ['SamplePushRequest'],
};

export default useQueryKeys;
