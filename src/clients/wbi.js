const crypto = require('crypto');

function getMixinKey(orig) {
    const table = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13];
    let str = orig.split('');
    let res = [];
    for (let i = 0; i < table.length; ++i) {
        res.push(str[table[i]]);
    }
    return res.join('').slice(0, 32);
}

function wbiSign(params, imgKey, subKey) {
    params = { ...params, wts: Math.floor(Date.now() / 1000).toString() };
    for (const k in params) {
        params[k] = String(params[k]).replace(/[!'()*]/g, '');
    }
    const items = Object.keys(params).sort().map(k => [k, params[k]]);
    const query = items.map(([k, v]) => `${k}=${v}`).join('&');
    const mixinKey = getMixinKey(imgKey + subKey);
    const w_rid = crypto.createHash('md5').update(query + mixinKey).digest('hex');
    return { ...params, w_rid };
}

module.exports = { wbiSign };