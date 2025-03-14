class DanmakuMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.uid = data.uid;
        this.uname = data.uname;
        this.msg = data.msg;
        this.timestamp = data.timestamp;
        this.fansMedalLevel = data.fans_medal_level;
        this.fansMedalName = data.fans_medal_name;
        this.fansMedalWearingStatus = data.fans_medal_wearing_status;
        this.guardLevel = data.guard_level;
    }
}

class GiftMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.uid = data.uid;
        this.uname = data.uname;
        this.giftId = data.gift_id;
        this.giftName = data.gift_name;
        this.giftNum = data.gift_num;
        this.price = data.price;
        this.paid = data.paid;
        this.fansMedalLevel = data.fans_medal_level;
        this.fansMedalName = data.fans_medal_name;
        this.fansMedalWearingStatus = data.fans_medal_wearing_status;
        this.guardLevel = data.guard_level;
        this.timestamp = data.timestamp;
    }
}

class GuardBuyMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.guardLevel = data.guard_level;
        this.num = data.num;
        this.userInfo = {
            uid: data.user_info.uid,
            uname: data.user_info.uname
        };
        this.timestamp = data.timestamp;
    }
}

class SuperChatMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.uid = data.uid;
        this.uname = data.uname;
        this.message = data.message;
        this.messageId = data.message_id;
        this.rmb = data.rmb;
        this.timestamp = data.timestamp;
        this.fansMedalLevel = data.fans_medal_level;
        this.fansMedalName = data.fans_medal_name;
        this.fansMedalWearingStatus = data.fans_medal_wearing_status;
        this.guardLevel = data.guard_level;
    }
}

class SuperChatDeleteMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.messageIds = data.message_ids;
    }
}

class LiveStartMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.timestamp = data.timestamp;
    }
}

class LiveEndMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.timestamp = data.timestamp;
    }
}

class RoomEnterMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.uid = data.uid;
        this.uname = data.uname;
        this.timestamp = data.timestamp;
        this.fansMedalLevel = data.fans_medal_level;
        this.fansMedalName = data.fans_medal_name;
        this.fansMedalWearingStatus = data.fans_medal_wearing_status;
        this.guardLevel = data.guard_level;
    }
}

class LikeMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.uid = data.uid;
        this.uname = data.uname;
        this.timestamp = data.timestamp;
        this.fansMedalLevel = data.fans_medal_level;
        this.fansMedalName = data.fans_medal_name;
        this.fansMedalWearingStatus = data.fans_medal_wearing_status;
        this.guardLevel = data.guard_level;
    }
}

module.exports = {
    DanmakuMessage,
    GiftMessage,
    GuardBuyMessage,
    SuperChatMessage,
    SuperChatDeleteMessage,
    LiveStartMessage,
    LiveEndMessage,
    RoomEnterMessage,
    LikeMessage
}; 