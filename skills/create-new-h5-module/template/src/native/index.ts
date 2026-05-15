import { listenAppMethod, Native } from './native';
import Toast from '/src/common/Toast/Toast';

export * from './native';

Native.setSchema('banban://');

export function getUserInfo() {
	// 获取用户信息
	return Native.callAppFunc<{
		lan?: string;
		server_env: string;
		token: string;
		uid: number;
		package: string;
		icon: string;
		name?: string;
		rid?: number;
		web_proxy_port?: number;
		domains: string;
	}>('getUserInfo');
}

// 进入指定房间
export function openRoom(rid: number | string) {
	return Native.callAppFunc('openRoom', { rid: Number(rid), inputString: '' });
}

// 设置页面标题
export function setTitle(title: string) {
	window.document.title = title;
	return Native.callAppFunc('setTitle', { title });
}

/**
 * 保存图片
 * @param url 支持http地址和data url
 */
export function saveImage(url: string) {
	if (url.startsWith('http')) return Native.callAppFunc('saveImage', { url });
	if (url.startsWith('data'))
		return Native.callAppFunc('saveImage', {
			content: `${url
				.split(',')
				.map((item, index) => (index === 0 ? item : encodeURIComponent(item)))
				.join(',')}`,
		});
}

// 分享图片 canvas绘制的图片 分享到QQ微信等
export function shareByImage(
	type: 'wechat' | 'moment' | 'qq' | 'qzone' | 'face',
	tp: number,
	imgUrl: string,
) {
	return Native.callAppFunc('shareDirect', { type, tp, imgUrl });
}

// 客户端重新回到H5
export function onReturnToWeb(callback: () => void) {
	return listenAppMethod('onReturnToWeb', callback);
}

// 分享到微信
export function shareWechat(tp: number) {
	return Native.callAppFunc('shareDirect', { type: 'wechat', tp });
}

// 分享到朋友圈
export function shareWechatMoment(tp: number) {
	return Native.callAppFunc('shareDirect', { type: 'moment', tp });
}

// 分享到QQ
export function shareQQ(tp: number) {
	return Native.callAppFunc('shareDirect', { type: 'qq', tp });
}

// 分享到QQ空间
export function shareQZone(tp: number) {
	return Native.callAppFunc('shareDirect', { type: 'qzone', tp });
}

// 分享到facebook
export function shareFacebook(tp: number) {
	return Native.callAppFunc('shareDirect', { type: 'facebook', tp });
}

// 分享到twitter
export function shareTwitter(tp: number) {
	return Native.callAppFunc('shareDirect', { type: 'twitter', tp });
}

// 分享到line
export function shareLine(tp: number) {
	return Native.callAppFunc('shareDirect', { type: 'line', tp });
}

// 跳转到web页
export function showScreen(url: string) {
	return Native.callAppFunc('showCommonWebScreen', { url });
}

// 跳转到个人主页
export function showImageScreen(uid: number | string) {
	return Native.callAppFunc('showImageScreen', { uid: Number(uid) });
}

// 进入附近
export function showNearby() {
	return Native.callAppFunc('showNearby');
}

// 进入粉丝列表
export function showFansList() {
	return Native.callAppFunc('showFansList');
}

// 进入首页
export function showHomePage() {
	return Native.callAppFunc('showHomePage');
}

// 进入动态页
export function showMomentPage() {
	return Native.callAppFunc('showMomentPage');
}

// 进入余额充值
export function showChargeBalance(refer?: string) {
	return Native.callAppFunc('showChargeBalance', refer ? { refer } : undefined);
}

// 进入朋友圈
export function showMoment() {
	return Native.callAppFunc('showMoment');
}

// 进入与指定好友聊天界面
export function showPrivateChat({ type, targetId }: { type: string; targetId: string }) {
	return Native.callAppFunc('showPrivateChat', { type, targetId });
}

// 消息Tab关注列表
export function showFollowList() {
	return Native.callAppFunc('showFollowList');
}

// 发现页
export function showDiscoveryPage() {
	return Native.callAppFunc('showDiscoveryPage');
}

// 剧本库列表
export function jubenList() {
	return Native.callAppFunc('jubenList');
}

// 跳转话题页
export function openTopicDetail(topicId: number) {
	return Native.callAppFunc('openTopicDetail', { topicId });
}

// 获取系统信息
export function getSystemInfoSync() {
	return Native.callAppFunc<{ statusBarHeight: number }>('getSystemInfoSync');
}

// 返回
export function navigateBack({ forceClose = false }: { forceClose: boolean }) {
	return Native.callAppFunc('navigateBack', { forceClose: forceClose ? 1 : 0 });
}

// 跳转到背包
export function openMyBag(params: Record<string, any>) {
	return Native.callAppFunc('openMyBag', params);
}

// 打开指定页面
export function schema(schemaUrl: string) {
	return Native.callAppFunc('schema', { schema_url: schemaUrl });
}

// 开始录音
export function startRecorder() {
	return Native.callAppFunc('startRecorder');
}

// 停止录音
export function stopRecorder() {
	return Native.callAppFunc<{
		success: boolean;
		duration: number;
		filePath: string;
		fileSize: number;
	}>('stopRecorder');
}

/**
 *
 * @param url 音频本地地址
 * @param callback 播放进度回调函数, 回调函数中的数据有兼容问题, 不建议使用回调的数据处理业务
 */
export function playAudio(url: string, callback: (data: unknown) => void) {
	return Native.subscribe<unknown>('playAudio', callback, { url });
}

export function showNativeToast(message: string) {
	return Native.callAppFunc<unknown>('showNativeToast', {
		toastMsg: message,
	});
}

export function openActivityShareDialog(activity_id: string, event_url: string) {
	return Native.callAppFunc('openActivityShareDialog', {
		activity_id: activity_id,
		event_url: event_url,
	}).catch(() => {
		Toast.show('你所使用的版本并不支持活动分享');
	});
}
