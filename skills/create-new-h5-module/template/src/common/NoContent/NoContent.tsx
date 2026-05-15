import { FC } from 'react';
import icErrorData from '/src/assets/common/error_data.svg';

type Props = {
	className?: string;
	text?: string;
};
export const NoContent: FC<Props> = ({ className = '', text = '没有数据' }) => {
	return (
		<div className={`${className} flex flex-col justify-center items-center`}>
			<img className="h-[80px]" src={icErrorData} alt="icErrorData" />
			<p className="text-center text-[16px] leading-none text-black">{text}</p>
		</div>
	);
};

export default NoContent;
