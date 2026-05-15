import './Reward.scoped.scss';
import { FC } from 'react';
import ola from '/src/ola';
import errImg from '/src/assets/common/error_data.svg';
import { isStringEmpty } from '/src/common/utils/utils';

const Reward: FC<{ image: string }> = ({ image }) => {
	return (
		<div className="aspect-square flex flex-col justify-center">
			{image ? (
				image.includes('webp') ? (
					<img
						className="w-full h-auto object-contain"
						alt="reward-icon"
						src={`${ola.app.config.oss}/${image}`}
					/>
				) : (
					<img
						className="w-full aspect-square object-contain"
						alt="reward-icon"
						src={`${ola.app.config.oss}/${image}?x-oss-process=image/resize,p_50`}
						onError={(e) => (e.currentTarget.src = errImg)}
					/>
				)
			) : null}
		</div>
	);
};

export const RewardItem: FC<{ gift: any }> = ({ gift }) => {
	const { iconUrl, name, tag, description } = gift;
	return (
		<div className="flex flex-col items-center w-[78px] text-center">
			<div className="bg-reward-circle w-[78px] h-[78px] flex flex-col items-center pt-[12px] relative">
				<div className="w-[47px] h-[47px]">
					<Reward image={iconUrl} />
				</div>
				{!isStringEmpty(tag) && (
					<div className="bg-tag absolute top-0 right-0">
						<p className="text-[12px] leading-[13px] text-[#7A1900] truncate max-w-[35px]">{tag}</p>
					</div>
				)}
			</div>
			<p className="text-[12px] leading-[14px] truncate w-[78px] text-[#7B1A00]">{name}</p>{' '}
			<p className="text-[12px] leading-[14px] truncate w-[78px] text-[#CC4127]">{description}</p>
		</div>
	);
};

export default Reward;
