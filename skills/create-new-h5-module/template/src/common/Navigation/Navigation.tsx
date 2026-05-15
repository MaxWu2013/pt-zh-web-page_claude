import './Navigation.scoped.scss';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { getSystemInfoSync, isFullScreen, isInApp, navigateBack } from '/src/native';
import { convertNativePxToActualPx } from '/src/common/utils/utils';

const IS_FULL_SCREEN = 'isFullScreen';

function useStatusBarHeight() {
	const [statusBarHeight, setStatusBarHeight] = useState(0);

	useEffect(() => {
		if (isFullScreen) {
			sessionStorage.setItem(IS_FULL_SCREEN, 'true');
		}
		if (!isInApp || sessionStorage.getItem(IS_FULL_SCREEN) !== 'true') return;
		getSystemInfoSync().then((result: any) => {
			setStatusBarHeight(result.statusBarHeight);
		});
	}, []);

	return statusBarHeight;
}

export function useNavigationBarOffset() {
	const [navigationBarOffset, setNavigationBarOffset] = useState(
		convertNativePxToActualPx(10 + 44),
	);

	function resizeWindow() {
		if (!isInApp) {
			setNavigationBarOffset(convertNativePxToActualPx(10 + 44));
		}
		getSystemInfoSync().then((result: any) => {
			setNavigationBarOffset(result.statusBarHeight + convertNativePxToActualPx(10 + 44));
		});
	}

	useEffect(() => {
		resizeWindow();
		window.addEventListener('resize', resizeWindow);
		return () => window.removeEventListener('resize', resizeWindow);
	}, []);

	return navigationBarOffset;
}

function useScrollTop() {
	const [top, setTop] = useState(0);

	useEffect(() => {
		const scrollHandler = () => setTop(Math.round(document.documentElement.scrollTop));
		window.document.addEventListener('scroll', scrollHandler);
		return () => window.document.removeEventListener('scroll', scrollHandler);
	}, []);

	return top;
}

type Props = {
	distance?: number; // 透明到不透明的距离
	color?: string;
	backgroundColor?: string;
	className?: string;
	mission?: boolean;
	more?: boolean;
	extraButtons?: ReactNode;
	children?: ReactNode;
	onClickMore?: () => void;
};

export default function Navigation(props: Props) {
	const {
		distance = 0,
		color = '#000',
		backgroundColor = 'transparent',
		className = '',
		mission = false,
		more = false,
		extraButtons,
		children,
		onClickMore,
	} = props;
	const statusBarHeight = useStatusBarHeight();
	const scrollTop = useScrollTop();

	const style = {
		backgroundColor,
		color,
		padding: `${statusBarHeight + 10}px 15px 0 15px`,
		opacity: distance === 0 ? 1 : Math.min(scrollTop, distance) / distance,
	};

	const goBack = useCallback(() => {
		if (isInApp) {
			navigateBack({ forceClose: false });
		} else {
			window.history.back();
		}
	}, []);

	return (
		<div className={`fixed w-full z-50 flex flex-row justify-between ${className}`} style={style}>
			<button
				className="btn-back h-[38px] w-[38px]"
				onClick={() => {
					goBack();
				}}
			/>

			<div
				className="absolute top-[20px] left-[50%] translate-x-[-50%]"
				style={{ paddingTop: `${statusBarHeight}px` }}
			>
				{children}
			</div>

			{more && (
				<div className="flex flex-col items-center gap-[6px]">
					<button
						className="btn-refresh w-[38px] h-[38px]"
						onClick={() => {
							window.location.reload();
						}}
					/>

					{extraButtons}
				</div>
			)}
		</div>
	);
}
