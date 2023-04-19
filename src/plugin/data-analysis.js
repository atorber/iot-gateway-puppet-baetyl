// 创建一个对象，包含两个方法
let analysis = {
    // 使用函数表达式定义raw2blink方法
    raw2blink: function (client, device, rawPayload) {
        // 截取前四个字符作为主题的一部分
        let topic = `thing/${device.productKey}/${device.productKey}/property/post`;

        // 创建一个空对象作为有效载荷
        let blinkPayload = rawPayload;
        client.publish(topic, JSON.stringty(blinkPayload))
        // 返回一个包含主题和有效载荷的对象
        return { topic, blinkPayload };
    },
    // 使用箭头函数定义blink2raw方法
    blink2raw: (client, device, blinkPayload) => {
        // 截取主题中的后四个字符作为原始数据的一部分
        let rawPayload = blinkPayload;
        client.publish(`thing/${device.productKey}/${device.productKey}/raw/c2d`, JSON.stringty(rawPayload))
        return rawPayload;
    }
};
exports = module.exports = {
    analysis
}