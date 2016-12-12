var wechat = {};
module.exports = wechat;

/**
 * 游戏承载类型
 * @type {{wxhtml: string, app: string}}
 */
var Type = wechat.Type = {
	wxhtml: 'wxhtml',
	app: 'app'
};
var _type;
/**
 * 初始化
 * @param type 枚举在 wechat.AppType
 * @param {object} config 格式 wxhtml: {appId, nonceStr, signature}
 */
wechat.init = function (type, config, cb) {
	type = Type[type];
	if (type == undefined) {
		return cb(new Error('Type ' + type + ' not exists'));
	}
	if (type == Type.wxhtml) {
		if (!window.wx) {
			return cb(new Error('window.wx not exists'));
		}
		window.wx.config({
			appId: config.appId,
			nonceStr: config.nonceStr,
			signature: config.signature,
			jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage']
		});
		window.wx.ready(function () {
			_type = type;
			cb();
		});
	} else if (type == Type.app) {
		if (!window.Wechat) {
			return cb(new Error('window.Wechat not exists'));
		}
		window.Wechat.isInstalled(function (installed) {
			if (installed) {
				_type = type;
				cb();
			} else {
				cb(new Error('wechat is not installed'));
			}
		}, function (reason) {
			cb(new Error("Failed: " + reason));
		});
	}
}

/**
 * 分享链接
 */
wechat.share = function (title, link, thumb, cb) {
	if (_type == Type.app) {
		window.Wechat.share({
			message: {
				title: title,
				thumb: thumb,
				media: {
					type: Wechat.Type.WEBPAGE,
					webpageUrl: link
				}
			},
			scene: Wechat.Scene.TIMELINE // share to Timeline
		}, function () {
			cb();
		}, function (reason) {
			cb(new Error("Failed: " + reason));
		});
	} else if (_type == Type.wxhtml) {
		window.wx.onMenuShareTimeline({
			title: title,
			link: link,
			imgUrl: thumb,
			success: function () {
				cb();
			},
			cancel: function () {
				cb(new Error('用户取消分享'));
			}
		});
	}
}