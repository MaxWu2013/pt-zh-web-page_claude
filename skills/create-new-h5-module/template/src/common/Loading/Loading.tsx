import './Loading.scoped.css';
import type { CSSProperties, FC } from 'react';

const Loading: FC<{ className?: string; style?: CSSProperties }> = ({ style, className }) => (
	<div className={`${className ?? ''} flex flex-col justify-center items-center`} style={style}>
		<div className="loading" style={{ borderColor: style?.color || 'red' }} />
	</div>
);

export default Loading;
