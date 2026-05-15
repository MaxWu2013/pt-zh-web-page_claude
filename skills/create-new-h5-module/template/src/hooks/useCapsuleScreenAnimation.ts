/**
 * Reference scaffold for an SVGA-driven capsule animation hook.
 *
 * The entire body of this file is intentionally commented out — it ships as
 * read-only reference material. Copy + adapt it when you need a similar
 * pattern: a button-triggered animation that loads an .svga asset, plays it,
 * cleans up after itself, and fires a result callback when the animation
 * lands on a known frame.
 *
 * Originally written for the "draw voucher" interaction in
 * `act/valentine-love-song-2026/src/hooks/useCapsuleScreenAnimation.ts` —
 * see that file for the live, uncommented version.
 *
 * Step-by-step to adapt:
 *
 *   1. Uncomment the imports below. Replace:
 *      - `LoadSvgaVideo` → your project's SVGA loader (usually
 *        `/src/service/SvgaService`),
 *      - `bg_draw_voucher.svga` → your animation asset under
 *        `src/assets/anim/<your-file>.svga`,
 *      - `ValentineLoveSong2026_ClaimVoucher_Data` → the proto-generated
 *        response type your animation reveals.
 *
 *   2. Rename the hook (`useDrawVoucherAnimation` → `useYourAnimation`)
 *      and the imperative handle (`onStartDrawAnimation` → whatever your
 *      page calls to kick the animation off).
 *
 *   3. In your page component, attach a `<canvas ref>` and forward it to
 *      this hook through `useImperativeHandle` — that's how the page calls
 *      `onStart…` without polluting the hook's public surface.
 *
 *   4. The `onDrawAnimationEnds` callback receives the result payload at
 *      the moment the animation lands on a "result frame" (configured
 *      inside the SVGA file). Use it to invalidate ReactQuery caches,
 *      navigate, or unlock the next UI step.
 *
 * If your module doesn't use SVGA at all, delete this file.
 */

// import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
// import { Player } from 'svga';
// import LoadSvgaVideo from '/src/service/SvgaService';
// import drawingSvga from '/src/assets/anim/bg_draw_voucher.svga';
// import { ValentineLoveSong2026_ClaimVoucher_Data } from '/src/service/valentine_love_song_2026';
//
// type Timer = ReturnType<typeof setTimeout>;
//
// export interface DrawVoucherHandle {
// 	onStartDrawAnimation: ({ data }: { data: ValentineLoveSong2026_ClaimVoucher_Data }) => void;
// }
//
// // Custom use hook for capsule animation for both claiming and idle
// function useDrawVoucherAnimation({
// 	ref,
// 	onDrawAnimationEnds,
// }: {
// 	ref:
// 		| ((instance: DrawVoucherHandle | null) => void)
// 		| React.MutableRefObject<DrawVoucherHandle | null>
// 		| null;
// 	onDrawAnimationEnds: ({ data }: { data: ValentineLoveSong2026_ClaimVoucher_Data }) => void;
// }) {
// 	const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
// 	const drawingPlayerRef = useRef<Player | null>(null);
// 	const stopDrawingPlayerTimeoutRef = useRef<Timer | null>(null);
//
// 	useImperativeHandle(
// 		ref,
// 		() => ({
// 			onStartDrawAnimation,
// 		}),
// 		[],
// 	);
//
// 	useEffect(() => {
// 		return () => {
// 			if (drawingPlayerRef.current) {
// 				drawingPlayerRef.current.destroy();
// 				drawingPlayerRef.current = null;
// 			}
// 			if (drawingCanvasRef.current) {
// 				drawingCanvasRef.current = null;
// 			}
// 			if (stopDrawingPlayerTimeoutRef.current) {
// 				clearTimeout(stopDrawingPlayerTimeoutRef.current);
// 				stopDrawingPlayerTimeoutRef.current = null;
// 			}
// 		};
// 	}, []);
//
// 	const onStartDrawAnimation = useCallback(({ data }) => {
// 		if (drawingCanvasRef.current) {
// 			LoadSvgaVideo({
// 				canvas: drawingCanvasRef.current,
// 				svgaSrc: drawingSvga,
// 			})
// 				.then((curPlayer) => {
// 					curPlayer.start();
// 					drawingPlayerRef.current = curPlayer;
// 					stopDrawingPlayerTimeoutRef.current = setTimeout(() => {
// 						onDrawAnimationEnds({ data });
// 						if (drawingPlayerRef.current) {
// 							drawingPlayerRef.current?.stop();
// 						}
// 					}, 1000);
// 				})
// 				.catch((error) => {
// 					console.error('Error loading SVGA animation:', error);
// 				});
// 		}
// 	}, []);
// 	return { drawingCanvasRef };
// }
//
// export default useDrawVoucherAnimation;
