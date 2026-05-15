import React, { FC } from 'react';
import './SectionContainer.scoped.scss';

const SectionContainer: FC = ({ children }) => {
	return (
		<div className="section-container w-full flex flex-col relative">
			<div className="section-top w-full h-[80px]"></div>
			<div className="section-middle w-full z-1">
				<div className="-mt-[88px] -mb-[50px]">{children}</div>
			</div>
			<div className="section-bottom h-[68px] w-full pointer-events-none"></div>
		</div>
	);
};

export default SectionContainer;
