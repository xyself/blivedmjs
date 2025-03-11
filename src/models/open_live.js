export class DanmakuMessage {
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

export class GiftMessage {
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

export class GuardBuyMessage {
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

export class SuperChatMessage {
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

export class SuperChatDeleteMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.messageIds = data.message_ids;
    }
}

export class LiveStartMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.timestamp = data.timestamp;
    }
}

export class LiveEndMessage {
    constructor(data) {
        this.roomId = data.room_id;
        this.timestamp = data.timestamp;
    }
}

export class RoomEnterMessage {
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

export class LikeMessage {
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