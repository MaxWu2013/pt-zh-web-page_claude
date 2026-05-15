/**
 * Reference pattern for a ReactQuery hook.
 *
 * ⚠️  NOTE: this file is DELETED automatically when `scaffold_module.py` runs
 * the conventions step — it imports `GetSampleApi`, which the scaffolder
 * also removes from `service/API.ts`. It's kept in the bundled template
 * purely as a copy-pasteable reference for what a real hook looks like.
 *
 * Pattern to copy into your own `use<Thing>.ts`:
 *
 *   1. import { useQuery } from '@tanstack/react-query';
 *   2. import queryKeys from '/src/hooks/ReactQuery/queryKeys';
 *   3. import { GetThing } from '/src/service/API';
 *   4. Wrap with `useQuery(queryKeys.Thing, GetThing, {...})` — pass a
 *      `select: (res) => res.data` option to unwrap the proto response.
 *   5. For mutations: `useMutation(PostThing, { onSuccess: ... })` and use
 *      `useQueryClient().setQueryData(queryKeys.Thing, updater)` for
 *      optimistic cache updates.
 *
 * Live example with both query + mutation + optimistic update:
 *   `tools/newbie-jump-rewards/src/hooks/ReactQuery/useHomeInfo.ts`
 */
import { useQuery } from '@tanstack/react-query';
import queryKeys from '/src/hooks/ReactQuery/queryKeys';
import { GetSampleApi } from '/src/service/API';

const useSampleReq = () => {
	const sampleInfoResp = useQuery(queryKeys.SamplePushRequest, GetSampleApi, {});

	return { ...sampleInfoResp, data: sampleInfoResp.data };
};

export default useSampleReq;
