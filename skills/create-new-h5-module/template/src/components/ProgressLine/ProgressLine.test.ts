import {
	GetTotalProgressWithRewards,
	GetTotalProgressWithoutRewards,
	isRewardUnlocked,
} from './ProgressLine';

interface Reward {
	name: string;
	imageUrl: string;
	progressToUnlock: number;
	description: string;
}
describe('GetTotalProgressWithoutRewards', () => {
	it('should return 100 when userScore is greater than or equal to maxScore', () => {
		expect(GetTotalProgressWithoutRewards(100, 100)).toBe(100);
		expect(GetTotalProgressWithoutRewards(120, 100)).toBe(100);
	});
	it('should return 0 when userScore is 0', () => {
		expect(GetTotalProgressWithoutRewards(0, 100)).toBe(0);
	});

	it('should return correct total progress for userScore within segments', () => {
		expect(GetTotalProgressWithoutRewards(25, 100)).toBeCloseTo(25, 1);
		expect(GetTotalProgressWithoutRewards(50, 100)).toBeCloseTo(50, 1);
		expect(GetTotalProgressWithoutRewards(75, 100)).toBeCloseTo(75, 1);
		expect(GetTotalProgressWithoutRewards(30, 100)).toBeCloseTo(30, 1);
		expect(GetTotalProgressWithoutRewards(60, 100)).toBeCloseTo(60, 1);
		expect(GetTotalProgressWithoutRewards(90, 100)).toBeCloseTo(90, 1);
	});
}); // Test for GetTotalProgress function
describe('GetTotalProgressWithRewards', () => {
	const rewards: Reward[] = [
		{ name: 'Reward1', imageUrl: 'url1', progressToUnlock: 25, description: '' },
		{ name: 'Reward2', imageUrl: 'url2', progressToUnlock: 50, description: '' },
		{ name: 'Reward3', imageUrl: 'url3', progressToUnlock: 75, description: '' },
	];

	it('should return 100 when userScore is greater than or equal to maxScore', () => {
		expect(GetTotalProgressWithRewards(100, 100, rewards)).toBe(100);
		expect(GetTotalProgressWithRewards(120, 100, rewards)).toBe(100);
	});

	it('should return 0 when userScore is 0', () => {
		expect(GetTotalProgressWithRewards(0, 100, rewards)).toBe(0);
	});

	it('should return correct total progress for userScore within segments', () => {
		expect(GetTotalProgressWithRewards(25, 100, rewards)).toBeCloseTo(16.66, 1);
		expect(GetTotalProgressWithRewards(50, 100, rewards)).toBeCloseTo(50, 1);
		expect(GetTotalProgressWithRewards(75, 100, rewards)).toBeCloseTo(83.33, 1);
		expect(GetTotalProgressWithRewards(30, 100, rewards)).toBeCloseTo(23.33, 1);
		expect(GetTotalProgressWithRewards(60, 100, rewards)).toBeCloseTo(63.33, 1);
		expect(GetTotalProgressWithRewards(90, 100, rewards)).toBeCloseTo(93.33, 1);
	});
});

describe('isRewardUnlocked', () => {
	it('should correctly determine if rewards are unlocked based on userScore', () => {
		const userScore = 60;
		const rewards = [
			{ name: 'Reward 1', imageUrl: 'url1', progressToUnlock: 50, description: '' },
			{ name: 'Reward 2', imageUrl: 'url2', progressToUnlock: 60, description: '' },
			{ name: 'Reward 3', imageUrl: 'url3', progressToUnlock: 70, description: '' },
		];

		const unlockedRewards = rewards.map((reward) => ({
			...reward,
			isUnlocked: isRewardUnlocked(userScore, reward),
		}));
		expect(unlockedRewards[0].isUnlocked).toBe(true);
		expect(unlockedRewards[1].isUnlocked).toBe(true);
		expect(unlockedRewards[2].isUnlocked).toBe(false);
	});
});
