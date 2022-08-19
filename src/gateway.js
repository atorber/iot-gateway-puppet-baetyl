const { Device } = require('./device')

class GateWay extends Device {
    constructor(entrypoint, productKey, deviceName, deviceSecret, instanceId) {
        super(entrypoint, productKey, deviceName, deviceSecret, instanceId); // 调用父类的 constructor(x, y)
        this.subDeviceList = [];
    }

    d2cRawPostSub(payload, subEquipment) {
        const topic = `thing/${this.productKey}/${this.deviceName}/raw/d2c`
        payload.subEquipment = subEquipment
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    propertyPostSub(payload, subEquipment) {
        const topic = `thing/${this.productKey}/${this.deviceName}/property/post`
        payload.subEquipment = subEquipment
        console.log('从baetyl发送到DMP的消息：')
        console.debug(topic, JSON.stringify(payload))
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    propertyBatchSub(payload, subEquipment) {
        const topic = `thing/${this.productKey}/${this.deviceName}/property/batch`
        payload.subEquipment = subEquipment
        console.log('从baetyl发送到DMP的消息：')
        console.debug(topic, JSON.stringify(payload))
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    eventPostSub(payload, subEquipment) {
        // console.log(payload,subEquipment)
        const topic = `thing/${this.productKey}/${this.deviceName}/event/post`
        payload.subEquipment = subEquipment
        console.log('从baetyl发送到DMP的消息：')
        console.debug(topic, JSON.stringify(payload))
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    eventBatchSub(payload, subEquipment) {
        const topic = `thing/${this.productKey}/${this.deviceName}/event/batch`
        payload.subEquipment = subEquipment
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }
}

exports = module.exports = {
    GateWay
}
