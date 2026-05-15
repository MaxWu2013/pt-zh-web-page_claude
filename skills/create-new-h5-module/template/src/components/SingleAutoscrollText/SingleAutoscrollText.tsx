import { FC, useEffect, useRef, useState } from 'react';
import { isStringEmpty } from '/src/common/utils/utils';
import Marquee from 'react-fast-marquee';

/*
 * SingleAutoscrollText is a custom component that tracks if the single text input overflows with its maximum width
 * if it is overflowing the parent container, it will use Marquee component and auto-scroll the text
 * if it is not overflowing the parent container, it will just center the text
 *
 * WARNING: The text color and style is set by its parent
 * */
const SingleAutoscrollText: FC<{ text: string }> = ({ text }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLParagraphElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);

	const checkOverflow = () => {
		const container = containerRef.current;
		const measureElement = measureRef.current;

		if (container && measureElement) {
			// Get the computed styles from the container to apply to measurement
			const containerStyles = window.getComputedStyle(container);

			// Apply the same font styles to the measurement element
			measureElement.style.fontSize = containerStyles.fontSize;
			measureElement.style.fontFamily = containerStyles.fontFamily;
			measureElement.style.fontWeight = containerStyles.fontWeight;
			measureElement.style.lineHeight = containerStyles.lineHeight;
			measureElement.style.letterSpacing = containerStyles.letterSpacing;

			// Set the text content
			measureElement.textContent = text;

			// Compare the text width with container width
			const textWidth = measureElement.scrollWidth;
			const containerWidth = container.clientWidth;

			setIsOverflowing(textWidth > containerWidth);
		}
	};

	useEffect(() => {
		// Use setTimeout to ensure the element is rendered before measuring
		const timeoutId = setTimeout(() => {
			checkOverflow();
		}, 0);

		// Optionally add resize observer for responsiveness
		window.addEventListener('resize', checkOverflow);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener('resize', checkOverflow);
		};
	}, [text]);

	if (isStringEmpty(text)) {
		return <></>;
	}

	return (
		<div ref={containerRef} className="mx-auto w-full relative">
			<p
				ref={measureRef}
				className="absolute top-0 left-0 opacity-0 pointer-events-none whitespace-nowrap"
				style={{ visibility: 'hidden', position: 'absolute', top: '-9999px' }}
			>
				{text}
			</p>

			{isOverflowing ? (
				<Marquee speed={25}>
					<p className="mr-[10px]">{text}</p>
				</Marquee>
			) : (
				<p className="text-center mx-auto w-full">{text}</p>
			)}
		</div>
	);
};

export default SingleAutoscrollText;
