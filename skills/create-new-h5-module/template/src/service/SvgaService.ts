import { Parser, Player } from 'svga';
import { Video } from 'svga/dist/types';

type OnBeforeMount = (parser: Parser, player: Player, video: Video) => Promise<void>;

const LoadSvgaVideo = async ({
								 canvas,
								 svgaSrc,
								 onBeforeMount,
							 }: {
	canvas: HTMLCanvasElement;
	svgaSrc: string;
	onBeforeMount?: OnBeforeMount;
}): Promise<Player> => {
	const parser = new Parser();
	const svga = await parser.load(svgaSrc);
	const player = new Player({
		container: canvas,
		isOpenNoExecutionDelay: true,
	});
	if (onBeforeMount) await onBeforeMount(parser, player, svga);
	await player.mount(svga);
	return player;
};

export default LoadSvgaVideo;
