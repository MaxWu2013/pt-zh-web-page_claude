/*eslint-disable*/

// 数字转换百分比
import { cloneElement } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { openRoom, showImageScreen } from '/src/native';
import { format, toZonedTime } from 'date-fns-tz';

const numToPercent = (num: number): string => {
	return `${(num * 100).toFixed(2)}%`;
};

// 数字格式化
const scoreTxt = (val: number | string) => {
	const score = Number(val || 0);
	return score <= 99999 ? score : `${(score / 10000).toFixed(2)}w`;
};

function formatWithSubstring(number: number) {
	if (!number) {
		return 0;
	}
	// 数字转为字符串，并按照 .分割
	const arr = (number + '').split('.');
	const int = arr[0] + '';
	const fraction = arr[1] || '';
	// 多余的位数
	const f = int.length % 3;
	// 获取多余的位数，f可能是0， 即r可能是空字符串
	let r = int.substring(0, f);
	// 每三位添加','金额对应的字符
	for (let i = 0; i < Math.floor(int.length / 3); i++) {
		r += ',' + int.substring(f + i * 3, f + (i + 1) * 3);
	}
	// 多余的位数，上面
	if (f === 0) {
		r = r.substring(1);
	}
	// 调整部分和小数部分拼接
	return r + (!!fraction ? '.' + fraction : '');
}

function numberToKString(
	num: number,
	{
		useCommas = true,
		maxStandardValue = 10_000_000,
		decimalPrecision = 0,
		trimTrailingZeros = false,
	} = {},
) {
	// If the number is below the maxStandardValue threshold, return it as is
	if (num < maxStandardValue) {
		return useCommas ? num.toLocaleString() : num.toString();
	}

	// Define units and thresholds
	const units = [
		{ threshold: 1_000_000_000, symbol: 'B' },
		{ threshold: 1_000_000, symbol: 'M' },
		{ threshold: 1_000, symbol: 'K' },
	];

	// Find the appropriate unit based on the number
	const matchedUnit = units.find(({ threshold }) => num >= threshold) || {
		threshold: 1,
		symbol: '',
	};

	// Calculate the rounded down value
	let formattedValue = (
		Math.floor((num / matchedUnit.threshold) * Math.pow(10, decimalPrecision)) /
		Math.pow(10, decimalPrecision)
	).toFixed(decimalPrecision);

	// Remove unnecessary decimal places if the option is set
	if (trimTrailingZeros) {
		formattedValue = parseFloat(formattedValue).toString();
	}

	return `${formattedValue}${matchedUnit.symbol}`;
}

function isStringEmpty(str: string | undefined) {
	if (str === undefined) {
		return true;
	}
	return str.length === 0;
}

function removeWhitespace(str: string) {
	if (str == undefined || str == null) {
		return '';
	}
	return str.replace(/\s+/g, '');
}

function flatMap(array: string | any[], fn: { (part: string): JSX.Element[]; (arg0: any): any }) {
	var result: any[] = [];
	for (var i = 0; i < array.length; i++) {
		var mapping = fn(array[i]);
		result = result.concat(mapping);
	}
	return result;
}

const toReplaceComponent = (
	originalString: string,
	stringToSplit: string,
	jsxComponentToReplaceWith: JSX.Element,
): JSX.Element => {
	const result = flatMap(originalString.split(stringToSplit), (part: string) => {
		return [
			<span key={uuidv4()}>{part}</span>,
			<span key={uuidv4()}>{jsxComponentToReplaceWith}</span>,
		];
	});
	result.pop();
	return result as unknown as JSX.Element;
};

const toReplaceComponentArr = (
	originalString: string,
	placeholders: string[],
	jsxElements: JSX.Element[],
): JSX.Element => {
	const escapedPlaceholders = placeholders.map((placeholder) =>
		placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
	);
	const splitString = originalString.split(new RegExp(`(${escapedPlaceholders.join('|')})`, 'g'));

	return (
		<>
			{splitString.map((segment) => {
				const placeholderIndex = placeholders.indexOf(segment);
				return placeholderIndex !== -1
					? cloneElement(jsxElements[placeholderIndex], { key: uuidv4() })
					: segment;
			})}
		</>
	);
};

const convertPxToVw = (px: number) => {
	return 100 * (px / 375);
};

const convertNativePxToActualPx = (px: number) => {
	return (px / 375) * window.innerWidth;
};

function avaClick(rid: number, uid: number) {
	if (rid > 0) {
		openRoom(rid);
		return;
	} else {
		showImageScreen(uid);
	}
}

function getDateTimeDisplay(milliseconds: number) {
	return (
		<div>
			<p>
				{format(toZonedTime(milliseconds * 1000, 'Asia/Shanghai'), 'MM.dd', {
					timeZone: 'Asia/Shanghai',
				})}
			</p>
			<p>
				{format(toZonedTime(milliseconds * 1000, 'Asia/Shanghai'), 'HH:mm', {
					timeZone: 'Asia/Shanghai',
				})}
			</p>
		</div>
	);
}

function timeout(delay: number) {
	return new Promise((res) => setTimeout(res, delay));
}

export {
	numToPercent,
	scoreTxt,
	formatWithSubstring,
	numberToKString,
	isStringEmpty,
	removeWhitespace,
	flatMap,
	toReplaceComponent,
	toReplaceComponentArr,
	convertPxToVw,
	convertNativePxToActualPx,
	avaClick,
};
