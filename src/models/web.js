/**
 * B站直播弹幕消息模型定义
 * 这个文件包含了所有B站直播WebSocket接口返回的消息类型
 * 每个类处理不同类型的消息并将其转换为易于使用的对象
 */

/**
 * 心跳消息类
 * 服务器会返回当前直播间的人气值
 */
class HeartbeatMessage {
    constructor(data) {
        this.popularity = data.popularity; // 直播间人气值
    }
}

/**
 * 弹幕消息类
 * 处理用户在直播间发送的文本弹幕
 */
class DanmakuMessage {
    constructor(raw) {
        this.raw = raw;                    // 原始消息数据
        const info = raw.info;             // B站弹幕info数组
        
        this.mode = info[0][1];           // 弹幕显示模式（1:滚动、4:底部、5:顶部）
        this.fontsize = info[0][2];       // 字体大小
        this.color = info[0][3];          // 弹幕颜色（十进制RGB值）
        this.timestamp = info[0][4];      // 时间戳（毫秒）
        this.random = info[0][5];         // 随机数
        this.uid = info[2][0];            // 用户ID
        this.uname = info[2][1];          // 用户名
        this.msg = info[1];               // 弹幕内容
        this.isAdmin = info[2][2];        // 是否房管
        this.medal = {                    // 粉丝勋章信息
            level: info[3][0],            // 勋章等级
            name: info[3][1],             // 勋章名称
            anchor: info[3][2],           // 勋章主播名
            roomid: info[3][3],           // 勋章房间号
            color: info[3][4],            // 勋章颜色
            specialColor: info[3][7]       // 特殊颜色
        };
        this.ul = info[4][0];            // 用户等级
        this.ulRank = info[4][1];        // 用户等级排名
    }
}

/**
 * 礼物消息类
 * 处理用户在直播间赠送的礼物信息
 */
class GiftMessage {
    constructor(raw) {
        this.raw = raw;                   // 原始消息数据
        const data = raw.data;            // 礼物数据
        
        this.uid = data.uid;              // 赠送者用户ID
        this.uname = data.uname;          // 赠送者用户名
        this.giftId = data.giftId;        // 礼物ID
        this.giftName = data.giftName;    // 礼物名称
        this.num = data.num;              // 赠送数量
        this.price = data.price;          // 礼物单价（金瓜子）
        this.coinType = data.coin_type;   // 货币类型（'gold'金瓜子 或 'silver'银瓜子）
        this.totalCoin = data.total_coin; // 总价格（单价*数量）
    }
}

/**
 * 用户互动消息类
 * 处理用户进入直播间等互动行为
 */
class InteractWordMessage {
    constructor(raw) {
        this.raw = raw;                   // 原始消息数据
        const data = raw.data;            // 互动数据
        
        this.uid = data.uid;              // 用户ID
        this.uname = data.uname;          // 用户名
        this.msgType = data.msg_type;     // 消息类型（1：进入直播间）
        this.timestamp = data.timestamp;  // 时间戳
        this.score = data.score;          // 积分
        this.fans_medal = data.fans_medal ? {  // 粉丝勋章信息（可能为null）
            anchor_roomid: data.fans_medal.anchor_roomid,  // 勋章所属主播的房间号
            medal_level: data.fans_medal.medal_level,      // 勋章等级
            medal_name: data.fans_medal.medal_name,        // 勋章名称
            target_id: data.fans_medal.target_id           // 勋章主播的用户ID
        } : {
            anchor_roomid: 0,
            medal_level: 0,
            medal_name: '',
            target_id: 0
        };
    }
}

/**
 * 舰长购买消息类
 * 处理用户购买大航海服务（舰长、提督、总督）的消息
 */
class GuardBuyMessage {
    constructor(raw) {
        this.raw = raw;                    // 原始消息数据
        const data = raw.data;             // 购买数据
        
        this.uid = data.uid;               // 购买者用户ID
        this.username = data.username;     // 购买者用户名
        this.guardLevel = data.guard_level;// 舰队等级（3：舰长，2：提督，1：总督）
        this.num = data.num;               // 购买数量
        this.price = data.price;           // 单价（金瓜子）
        this.giftId = data.gift_id;        // 对应礼物ID
        this.giftName = data.gift_name;    // 对应礼物名称
    }
}

/**
 * 醒目留言消息类（SuperChat）
 * 处理用户发送的付费高亮消息
 */
class SuperChatMessage {
    constructor(raw) {
        this.raw = raw;                      // 原始消息数据
        const data = raw.data;               // SC数据
        
        this.uid = data.uid;                 // 用户ID
        this.uname = data.user_info.uname;   // 用户名
        this.message = data.message;         // 消息内容
        this.price = data.price;             // 价格（人民币）
        this.time = data.time;               // 持续时间（秒）
        this.startTime = data.start_time;    // 开始时间戳
        this.endTime = data.end_time;        // 结束时间戳
    }
}

/**
 * 观看人数变化消息类
 * 处理直播间观看人数变化的通知
 */
class WatchedChangeMessage {
    constructor(data) {
        this.num = data.data.num;              // 观看人数
        this.text_small = data.data.text_small; // 小号文本（如"1.2万人看过"）
        this.text_large = data.data.text_large; // 大号文本
    }
}

/**
 * 在线排名计数消息类
 * 处理直播间高能用户数量相关信息
 */
class OnlineRankCountMessage {
    constructor(data) {
        this.count = data.data.count;                 // 高能用户数量
        this.count_text = data.data.count_text;       // 高能用户数量文本
        this.online_count = data.data.online_count;   // 在线用户数量
        this.online_count_text = data.data.online_count_text; // 在线用户数量文本
    }
}

/**
 * 在线排名详情消息类
 * 处理直播间高能用户排名详情
 */
class OnlineRankV2Message {
    constructor(data) {
        this.online_list = data.data.online_list; // 在线用户列表
        this.rank_type = data.data.rank_type;     // 排名类型
    }
}

/**
 * 停播房间列表消息类
 * 处理批量停播房间的通知
 */
class StopLiveRoomListMessage {
    constructor(data) {
        this.room_id_list = data.data.room_id_list; // 停播房间ID列表
    }
}

/**
 * 点赞信息更新消息类
 * 处理直播间总点赞数变化的通知
 */
class LikeInfoV3UpdateMessage {
    constructor(data) {
        this.click_count = data.data.click_count; // 点赞总数
    }
}

/**
 * 进场特效消息类
 * 处理用户进入直播间触发的特效（如舰长进场特效）
 */
class EntryEffectMessage {
    constructor(message) {
        this.uid = message.data.uid;                // 用户ID
        this.uname = message.data.copy_writing;     // 用户名（从文案中提取）
        this.privilege_type = message.data.privilege_type; // 特权类型
        this.copy_writing = message.data.copy_writing;     // 特效文案（如"欢迎舰长xxx进入直播间"）
    }
}

/**
 * 用户点赞消息类
 * 处理单个用户点赞的通知
 */
class LikeClickMessage {
    constructor(message) {
        this.uid = message.data.uid;               // 用户ID
        this.uname = message.data.uname;           // 用户名
        this.like_text = message.data.like_text;   // 点赞文本
        this.uinfo = message.data.uinfo;           // 用户信息
        this.fans_medal = message.data.fans_medal ? {  // 粉丝勋章信息
            anchor_roomid: message.data.fans_medal.anchor_roomid,  // 勋章所属主播的房间号
            medal_level: message.data.fans_medal.medal_level,      // 勋章等级
            medal_name: message.data.fans_medal.medal_name,        // 勋章名称
            target_id: message.data.fans_medal.target_id           // 勋章主播的用户ID
        } : null;
    }
}

/**
 * 用户礼物提示V2消息类
 * 处理新版礼物提示（主要是大航海）
 */
class UserToastV2Message {
    constructor(message) {
        const data = message.data;
        this.username = data.username;        // 用户名
        this.guard_level = data.guard_level;  // 舰队等级
        this.price = data.price;              // 价格
        this.num = data.num;                  // 数量
        this.unit = data.unit;                // 单位
        this.role_name = data.role_name;      // 角色名称
        this.start_time = data.start_time;    // 开始时间
        this.end_time = data.end_time;        // 结束时间
    }
}

/**
 * 礼物连击消息类
 * 处理用户连续赠送同一礼物的信息
 */
class ComboSendMessage {
    constructor(message) {
        const data = message.data;
        this.uid = data.uid;                   // 用户ID
        this.uname = data.uname;               // 用户名
        this.combo_num = data.combo_num;       // 连击数量
        this.gift_name = data.gift_name;       // 礼物名称
        this.gift_id = data.gift_id;           // 礼物ID
        this.price = data.price;               // 单价
        this.combo_total_coin = data.combo_total_coin; // 连击总价值（瓜子）
    }
}

/**
 * 热门榜单变化消息类
 * 处理直播间在热门榜单上排名变化的通知
 */
class HotRankChangedMessage {
    constructor(message) {
        const data = message.data;
        this.rank = data.rank;               // 当前排名
        this.trend = data.trend;             // 趋势（0:持平, 1:上升, 2:下降）
        this.countdown = data.countdown;     // 倒计时
        this.timestamp = data.timestamp;     // 时间戳
        this.web_url = data.web_url;         // 网页链接
        this.live_url = data.live_url;       // 直播链接
        this.pc_link_url = data.pc_link_url; // PC端链接
    }
}

/**
 * 直播状态消息类
 * 处理直播开始/结束的通知
 */
class LiveMessage {
    constructor(message) {
        const data = message.data;
        this.live_status = data.live_status; // 直播状态（1:开播, 2:下播）
        this.live_time = data.live_time;     // 直播时间
        this.live_key = data.live_key;       // 直播密钥
    }
}

/**
 * 系统通知消息类
 * 处理全平台或房间内的系统通知
 */
class NoticeMsgMessage {
    constructor(message) {
        const data = message;
        this.msg_common = data.msg_common;   // 通用消息内容
        this.msg_self = data.msg_self;       // 自己看到的消息内容
        this.link_url = data.link_url;       // 链接URL
        this.msg_type = data.msg_type;       // 消息类型
    }
}

/**
 * PK对战消息类
 * 处理直播间PK对战的状态变化
 */
class PKBattleMessage {
    constructor(message) {
        const data = message.data;
        this.battle_type = data.battle_type; // 对战类型
        this.init_info = data.init_info;     // 初始信息
        this.match_info = data.match_info;   // 匹配信息
        this.pk_status = data.pk_status;     // PK状态
    }
}

/**
 * PK对战结算消息类
 * 处理直播间PK对战结束后的结算信息
 */
class PKBattleSettleMessage {
    constructor(message) {
        const data = message.data;
        this.pk_id = data.pk_id;              // PK ID
        this.settle_status = data.settle_status; // 结算状态
        this.timestamp = data.timestamp;      // 时间戳
        this.winner = data.winner;            // 获胜者信息
    }
}

/**
 * 直播准备中消息类
 * 处理直播间进入准备状态的通知
 */
class PreparingMessage {
    constructor(message) {
        const data = message.data;
        this.roomid = data.roomid;           // 房间ID
    }
}

/**
 * 房间实时信息更新消息类
 * 处理直播间粉丝数等实时数据的更新
 */
class RoomRealTimeMessageUpdateMessage {
    constructor(message) {
        const data = message.data;
        this.roomid = data.roomid;            // 房间ID
        this.fans = data.fans;                // 粉丝数
        this.red_notice = data.red_notice;    // 红色通知
        this.fans_club = data.fans_club;      // 粉丝团数量
    }
}

/**
 * 用户礼物提示消息类
 * 处理用户赠送礼物的提示
 */
class UserToastMessage {
    constructor(message) {
        const data = message.data;
        this.uid = data.uid;                  // 用户ID
        this.username = data.username;        // 用户名
        this.toast_msg = data.toast_msg;      // 提示消息
        this.num = data.num;                  // 数量
    }
}

/**
 * 横幅组件消息类
 * 处理直播间顶部横幅通知
 */
class WidgetBannerMessage {
    constructor(message) {
        const data = message.data;
        this.timestamp = data.timestamp;      // 时间戳
        this.widget_list = data.widget_list;  // 组件列表
    }
}

// 导出所有消息类
module.exports = {
    HeartbeatMessage,
    DanmakuMessage,
    GiftMessage,
    InteractWordMessage,
    GuardBuyMessage,
    SuperChatMessage,
    WatchedChangeMessage,
    OnlineRankCountMessage,
    OnlineRankV2Message,
    StopLiveRoomListMessage,
    LikeInfoV3UpdateMessage,
    LikeClickMessage,
    EntryEffectMessage,
    UserToastV2Message,
    ComboSendMessage,
    HotRankChangedMessage,
    LiveMessage,
    NoticeMsgMessage,
    PKBattleMessage,
    PKBattleSettleMessage,
    PreparingMessage,
    RoomRealTimeMessageUpdateMessage,
    UserToastMessage,
    WidgetBannerMessage
}; 