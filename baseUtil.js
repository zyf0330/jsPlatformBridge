/**
 * 基础工具
 */

/**
 * 不是iOS就是Android
 * @returns {boolean} 是否是iOS
 */
function isIOS() {
	if (window.device && device.platform) {
		return device.platform == 'iOS';
	} else {
		return navigator.userAgent.indexOf('iPhone') > -1;
	}
}
