/* eslint-disable sort-keys */
const { v4 } = require('uuid')
const { Auth } = require('./auth')
const mqtt = require('mqtt')

class Device {
    constructor(entrypoint, productKey, deviceName, deviceSecret, instanceId, baetylMqttClient) {
        this.entrypoint = entrypoint;
        this.productKey = productKey;
        this.deviceName = deviceName;
        this.deviceSecret = deviceSecret;
        this.instanceId = instanceId;
        this.mqttClient = ''
        this.init(baetylMqttClient)
    }

    async init(baetylMqttClient) {
        const that = this
        const auth = new Auth(
            this.entrypoint,
            this.productKey,
            this.deviceName,
            this.deviceSecret,
            this.instanceId
        )
        const devieConfig = await auth.getResources()

        console.debug('devieConfig', devieConfig)

        const optionsDevice = {
            host: devieConfig.broker,
            username: devieConfig.username,
            password: devieConfig.password,
            port: devieConfig.port || 1883,
            clientId: v4()
        }

        this.mqttClient = mqtt.connect(optionsDevice)

        this.mqttClient.on('connect', function (err) {

            that.subPropertyInvoke()
            that.subCommandInvoke()
            that.subC2d()

        })

        this.mqttClient.on('disconnect', function () {
            mqttClient.reconnect()
        })

        this.mqttClient.on('message', function (topic, message) {
            // message is Buffer
            console.log(message.toString())
            console.log(topic)

            let report = JSON.parse(message.toString())
            // console.log(report)
            if (report.subEquipment && report.method) {

                if (topic.indexOf("property/invoke") != -1) {

                    console.log('从DMP收到一条设置属性消息')
                    const curSubEquipment = report.subEquipment
                    const topic = `thing/${curSubEquipment.productKey}/${curSubEquipment.deviceName}/property/invoke`
                    delete report.subEquipment
                    let payload = {
                        "kind": "deviceDelta",
                        "meta": {
                            "accessTemplate": "xw-modbus-access-template",
                            "device": curSubEquipment.deviceName, // 子设备的deviceName
                            "deviceProduct": curSubEquipment.productKey, // 子设备的productKey
                            "node": that.deviceName, // 网关的deviceName
                            "nodeProduct": that.productKey // 网关的productKey
                        },
                        "content": {
                            "blink": report
                        }
                    }

                    console.log('即将发送到baetyl-broker的消息：', topic, JSON.stringify(payload))

                    baetylMqttClient.publish(topic, JSON.stringify(payload))
                }

                //    if(topic.indexOf("event/post") != -1||report.content.blink.events){

                //        console.log('收到一条事件消息')

                //        let payload = report.content.blink
                //        let subEquipment = {
                //            productKey: report.meta.deviceProduct,
                //            deviceName: report.meta.device
                //        }
                //        gwClient.eventPostSub(payload, subEquipment)
                //    }

            } else {
                console.error('暂未支持转发的接口')
            }

        })
    }

    subPropertyInvoke() {
        const topic = `thing/${this.productKey}/${this.deviceName}/property/invoke`

        this.mqttClient.subscribe(topic, function (err) {
            if (!err) {
                console.debug('订阅更新设备可写属性消息成功')
            } else {
                console.debug('订阅更新设备可写属性消息失败')
            }
        })
    }

    subCommandInvoke() {
        const topic = `thing/${this.productKey}/${this.deviceName}/command/invoke`

        this.mqttClient.subscribe(topic, function (err) {
            if (!err) {
                console.debug('订阅云端调用设备端服务消息成功')
            } else {
                console.debug('订阅云端调用设备端服务消息失败')
            }
        })
    }

    subC2d() {
        const topic = `thing/${this.productKey}/${this.deviceName}/raw/c2d`

        this.mqttClient.subscribe(topic, function (err) {
            if (!err) {
                console.debug('订阅自定义透传信息成功')
            } else {
                console.debug('订阅自定义透传信息失败')
            }
        })
    }

    d2cRawPost(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/raw/d2c`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    propertyPost(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/property/post`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    propertyBatch(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/property/batch`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    eventPost(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/event/post`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    eventBatch(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/event/batch`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    propertyMessage(raw) {

        // 需要在此实现原始属性消息转换为blink的逻辑代码

        // let properties = {
        //     key1: 100
        // }

        // 原始属性消息转换为blink的逻辑结束

        // let message = {
        //     reqId: v4(),
        //     method: 'thing.property.post',
        //     version: '1.0',
        //     timestamp: getCurTime(),
        //     properties,
        // }

        // const payload = JSON.stringify(message)
        return raw
    }

    eventMessage(raw) {

        // let message = {
        //     reqId: v4(),
        //     method: 'thing.event.post',
        //     version: '1.0',
        //     timestamp: new Date().getTime(),
        //     events: {
        //     },
        // }

        // 需要在此实现原始事件raw消息转换为blink的逻辑代码

        // let name = 'raw'
        // raw.data = raw.data.toString()
        // let input = raw

        // 原始事件raw消息转换为blink的逻辑结束

        // message.events[name] = input
        // console.debug(message)
        return raw
    }

}

function getCurTime() {
    // timestamp是整数，否则要parseInt转换
    const timestamp = new Date().getTime()
    const timezone = 8 // 目标时区时间，东八区
    const offsetGMT = new Date().getTimezoneOffset() // 本地时间和格林威治的时间差，单位为分钟
    // const time = timestamp + offsetGMT * 60 * 1000 + timezone * 60 * 60 * 1000
    const time = timestamp + offsetGMT * 60 * 1000
    return time
}

exports = module.exports = {
    Device
}
