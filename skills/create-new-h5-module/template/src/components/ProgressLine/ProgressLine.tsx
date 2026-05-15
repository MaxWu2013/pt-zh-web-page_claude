import './ProgressLine.scoped.scss';
import { FC } from 'react';
import Reward from '/src/components/Reward/Reward';
import SingleAutoscrollText from '/src/components/SingleAutoscrollText/SingleAutoscrollText';

interface ProgressLineProps {
	score: number;
	totalScore: number;
	milestones: any[];
}

export function GetSegmentProgress(currentScore: number, prevScore: number, nextScore: number) {
	if (currentScore <= prevScore) return 0;
	if (currentScore >= nextScore) return 100;
	return ((currentScore - prevScore) / (nextScore - prevScore)) * 100;
}

export function GetTotalProgressWithoutMilestones(userScore: number, maxScore: number) {
	if (userScore >= maxScore) return 100;
	return (userScore / maxScore) * 100;
}

//To accommodate to UI requirements, first and last segments are half the length of the rest of the segments
export function GetTotalProgressWithMilestones(
	userScore: number,
	maxScore: number,
	milestones: any[],
) {
	if (userScore >= maxScore) return 100;
	let totalPercentage = 0;

	for (let i = 0; i < milestones.length; i++) {
		const nextScore = i === milestones.length - 1 ? maxScore : milestones[i].progressToUnlock;
		const prevScore = i === 0 ? 0 : milestones[i - 1].progressToUnlock;
		let segmentPercentage = GetSegmentProgress(userScore, prevScore, nextScore);
		segmentPercentage /= milestones.length;
		totalPercentage += segmentPercentage;

		if (userScore < nextScore) break;
	}
	return totalPercentage;
}

export function isMilestoneUnlocked(userScore: number, reward: any): boolean {
	return userScore >= reward.progressToUnlock;
}

const ProgressLine: FC<ProgressLineProps> = ({ score, milestones, totalScore }) => {
	if (totalScore === 0) {
		return <div />;
	}
	const userScore = score;
	const maxScore = totalScore;
	//Calculates the progress percentage for a given segment.
	const progressPercentage =
		milestones.length > 0
			? GetTotalProgressWithMilestones(userScore, maxScore, milestones)
			: GetTotalProgressWithoutMilestones(userScore, maxScore);

	return (
		<div className="relative h-full w-full bg-progress-bar border-solid border-[1px] border-[#423128] rounded-[12px]">
			<div
				className="bg-progress-bar-fill rounded-[12px] h-full"
				style={{ width: `${progressPercentage}%` }}
			/>
		</div>
	);
};

export const ProgressMilestone: FC<ProgressLineProps> = ({ score, totalScore, milestones }) => {
	if (totalScore === 0) {
		return <div />;
	}
	// function get
	const userScore = score;
	return (
		<div className="w-full mx-auto flex flex-row justify-between ml-[8px]">
			<div />
			{milestones.map((milestone, index) => {
				const isUnlocked = isMilestoneUnlocked(userScore, milestone);
				return (
					<div
						key={`progress-line-milestone-${index}`}
						className={`z-2 flex flex-col items-center ${milestones.length > 5 ? 'w-[42px] -mr-[5px]' : 'w-[49px] -mr-[10px]'}`}
					>
						<div
							className={`bubble px-[5px] min-w-[32px] h-[15px] pt-[2px] ${isUnlocked ? 'active' : ''}`}
						>
							<p className="text-[10px] leading-[11px] text-[#080503] text-center">
								{milestone.progressToUnlock ?? 0}
							</p>
						</div>

						<div className="h-[10px]" />
						<div className={`ic-milestone h-[28px] w-[33px] z-2 ${isUnlocked ? 'active' : ''}`} />
						<div className="h-[8px]" />
						<div className="flex flex-col items-center text-center w-full">
							<div
								className={`bg-reward ${isUnlocked ? 'active' : ''} ${milestones.length > 5 ? 'w-[42px] h-[42px] p-[3px]' : 'w-[49px] h-[49px] p-[4px]'}`}
							>
								<Reward image={milestone.gift?.iconUrl ?? ''} />
							</div>
							<div className="h-[5px]" />
							<div className="w-[48px] text-[#EBC89B] text-[11px] leading-none">
								<SingleAutoscrollText text={milestone.gift.name} />
							</div>
							<div className="h-[4px]" />
							<p className="text-[#EBC89B] text-[11px] text-center leading-none w-[49px] truncate">
								{milestone.gift.description}
							</p>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default ProgressLine;
