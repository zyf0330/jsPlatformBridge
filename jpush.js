/**
 * jPush 极光推送
 */

var _type;
/**
 * 游戏承载类型
 * @type {{wxhtml: string, app: string}}
 */
var Type = exports.Type = {
	wxhtml: 'wxhtml',
	app: 'app'
};

/**
 * 返回的notify，有title、content、msg_id、optional等字段。注意，ios没有title。
 * Android的receiveNotification，可以在后台触发。iOS的receiveNotification不会在后台触发，因此要根据msd_id来判断是否处理重复。
 * 初始化失败抛出错误
 * @param openNotificationCallback {function} 打开通知回调，返回notify。
 * @param receiveNotificationCallback {function} 收到通知回调，返回notify
 * @param receiveMessageCallback {function} 收到自定义消息回调，返回notify。ios没有msg_id
 */
function initNotification(type, openNotificationCallback, receiveNotificationCallback, receiveMessageCallback) {
	type = Type[type];
	if (type == undefined) {
		throw new Error('Type ' + type + ' not exists');
	}
	if (type == Type.app) {
		var jpush = window.plugins && window.plugins.jPushPlugin;
		if (!jpush) {
			throw new Error('JPush Plugin is not ready');
		}
		if (isPushEnabled()) {//init只需要第一次调用
			jpush.init();
			jpush.resumePush();
		}
		//点击通知
		document.addEventListener("jpush.openNotification", function (event) {
			var notify_obj;
			var notify = {
				msg_id: null,
				title: undefined,
				content: null,
				optional: null
			};
			if (isIOS() == false) {
				notify_obj = jpush.openNotification;
				notify.msg_id = notify_obj.extras['cn.jpush.android.MSG_ID'];
				notify.title = notify_obj.title;
				notify.content = notify_obj.alert;
				notify.optional = notify_obj.extras['cn.jpush.android.EXTRA'];
			} else {
				notify_obj = event;
				notify.msg_id = notify_obj._j_msgid;
				notify.content = notify_obj.aps.alert;
				notify.optional = notify_obj;
				setBadge(notify_obj.aps.badge);
			}
			typeof openNotificationCallback == 'function' && openNotificationCallback(notify);
		}, false);
		//接收通知
		document.addEventListener("jpush.receiveNotification", function (event) {
			var notify_obj;
			var notify = {
				msg_id: null,
				title: undefined,
				content: null,
				optional: null
			};
			if (isIOS() == false) {
				notify_obj = jpush.receiveNotification;
				notify.msg_id = notify_obj.extras['cn.jpush.android.MSG_ID'];
				notify.title = notify_obj.title;
				notify.content = notify_obj.alert;
				notify.optional = notify_obj.extras['cn.jpush.android.EXTRA'];
			} else {
				notify_obj = event;
				notify.msg_id = notify_obj._j_msgid;
				notify.content = notify_obj.aps.alert;
				notify.optional = notify_obj;
				setBadge(notify_obj.aps.badge);
				//apple bug，可能重复收到通知
				var local_msgid = localStorage.getItem('lastMsg');
				localStorage.setItem('lastMsg', notify.msg_id);
				if (local_msgid == notify.msg_id) {
					return;
				}
			}
			typeof receiveNotificationCallback == 'function' && receiveNotificationCallback(notify);
		}, false);
		//接收自定义消息
		document.addEventListener("jpush.receiveMessage", function (event) {
			var notify_obj;
			var notify = {
				msg_id: null,
				title: undefined,
				content: null,
				optional: null
			};
			if (isIOS() == false) {
				notify_obj = window.plugins.jPushPlugin.receiveMessage;
				notify.msg_id = notify_obj.extras['cn.jpush.android.MSG_ID'];
				notify.content = notify_obj.message;
				notify.optional = notify_obj.extras['cn.jpush.android.EXTRA'];
			} else {
				notify_obj = event;
				notify.msg_id = notify_obj._j_msgid;
				notify.content = notify_obj.content;
				notify.optional = notify_obj.extras;
			}
			typeof receiveMessageCallback == 'function' && receiveMessageCallback(notify);
		}, false);
	}
}
exports.initNotification = initNotification;
/**
 * 关闭推送
 */
function disablePush() {
	localStorage.setItem('jpush_disablePush', 1);
	window.plugins.jPushPlugin.stopPush();
}
exports.disablePush = disablePush;
/**
 * 启用推送
 */
function enablePush() {
	localStorage.setItem('jpush_disablePush', 0);
	window.plugins.jPushPlugin.resumePush();
}
exports.enablePush = enablePush;

/**
 * 推送是否启用
 */
function isPushEnabled() {
	return localStorage.getItem('jpush_disablePush') != 1;
}

/**
 * 获取推送设备id
 * @param cb {function(string)} 返回id
 */
function getPushID(cb) {
	window.plugins.jPushPlugin.getRegistrationID(function (id) {
		typeof cb == 'function' && cb(id);
	});
}
exports.getPushID = getPushID;
/**
 * 是否服务器停止推送
 * @param cb {function(boolean)} true为关闭
 */
function isPushStopped(cb) {
	window.plugins.jPushPlugin.isPushStopped(function (r) {
		typeof cb == 'function' && cb(r > 0 ? true : false);
	});
}
exports.isPushStopped = isPushStopped;
/**
 * 是否用户禁止通知
 * @param cb {function(boolean)} true为禁止
 */
function isPushDenied(cb) {
	window.plugins.jPushPlugin.getUserNotificationSettings(function (r) {
		typeof cb == 'function' && cb(r == 0 ? true : false);
	});
}
exports.isPushDenied = isPushDenied;

/**
 * 设置本地的角标值。仅限iOS。私有接口
 */
function setBadge(num) {
	if (isIOS() == false) {
		return;
	}
	num = parseInt(num);
	if (isNaN(num)) {
		num = 0;
	}
	window.plugins.jPushPlugin.setApplicationIconBadgeNumber(num);
	localStorage.setItem('badgeNum', num);
}
/**
 * 获取当本地的角标数。仅限iOS
 * @returns {number}
 */
function getBadge() {
	if (isIOS() == false) {
		return;
	}
	var badgeNum = +localStorage.getItem('badgeNum');
	isNaN(badgeNum) && (badgeNum = 0);
	return badgeNum;
}
exports.getBadge = getBadge;
/**
 * 角标数字减去一定数量。仅限iOS
 * @param num {number} 默认为1，大于0的整数
 */
function reduceBadge(num) {
	if (isIOS() == false) {
		return;
	}
	num = parseInt(num);
	if (isNaN(num) || num <= 0) {
		num = 1;
	}
	var jpush = window.plugins.jPushPlugin;
	var badgeNum = Math.max(getBadge() - num, 0);
	jpush.setApplicationIconBadgeNumber(badgeNum);
	jpush.setBadge(badgeNum);
	setBadge(badgeNum);
}
exports.reduceBadge = reduceBadge;
