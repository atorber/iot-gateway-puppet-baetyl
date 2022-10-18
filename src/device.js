/* eslint-disable sort-keys */
const { v4 } = require('uuid')
const { Auth } = require('./auth')
const mqtt = require('mqtt')

//定义一个延时方法
let wait = ms => new Promise(resolve => setTimeout(resolve, ms));
class Device {
    constructor(optionsDevice, onCommand) {
        const {
            entrypoint, productKey, deviceName, deviceSecret, instanceId
        } = optionsDevice

        this.entrypoint = entrypoint;
        this.productKey = productKey;
        this.deviceName = deviceName;
        this.deviceSecret = deviceSecret;
        this.instanceId = instanceId;
        this.onCommand = onCommand
        this.mqttClient = ''
        this.init(onCommand)
    }

    async init() {
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

        this.mqttClient.on('disconnect', async function () {
            await wait(2000)
            that.mqttClient.reconnect()
        })

        this.mqttClient.on('connect', function () {
            console.log('DMP客户端连接成功')
        })

        this.mqttClient.on('error', async function (err) {
            console.log('DMP客户端连接错误', err)
        })

        this.mqttClient.on('message', this.onCommand)
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

    d2cResponsePost(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/response/d2c`
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
