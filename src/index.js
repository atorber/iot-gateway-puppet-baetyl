/**
 * baetyl-broker转dmp
 */

const { v4 } = require('uuid')
const mqtt = require('mqtt')
const { GateWay } = require('./gateway')

const fs = require('fs')
const path = require('path')

//定义一个延时方法
let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let puppet = process.env['puppet']

if (puppet === '82mqtt') {

    let baetylCleint = {}
    let optionsBaetyl = {}

    // 使用用户名和密码方式连接二公司MQTT

    const HOST = process.env['baetyl_broker_host'] || '0.0.0.0'
    const PORT = process.env['baetyl_broker_port'] || 1883
    optionsBaetyl = {
        host: HOST,
        username: process.env['baetyl_broker_username'] || '',
        password: process.env['baetyl_broker_password'] || '',
        port: PORT,
        clientId: v4()
    }



    baetylCleint = mqtt.connect(optionsBaetyl)


    // DMP客户端
    const entrypoint = process.env['entrypoint'];
    const productKey = process.env['productKey'];
    const deviceName = process.env['deviceName'];
    const deviceSecret = process.env['deviceSecret'];
    const instanceId = process.env['instanceId'];

    const propertySub = `thing/${productKey}/${deviceName}/property/post`
    const d2cResponseSub = `thing/${productKey}/${deviceName}/response/d2c`

    let gwClient = new GateWay(entrypoint, productKey, deviceName, deviceSecret, instanceId, baetylCleint)

    baetylCleint.on('connect', function () {

        baetylCleint.subscribe(propertySub, function (err) {
            if (!err) {
                console.debug('baetyl订阅属性消息成功:', propertySub)
            } else {
                console.debug('baetyl订阅属性消息失败:', propertySub)
            }
        })
        baetylCleint.subscribe(d2cResponseSub, function (err) {
            if (!err) {
                console.debug('baetyl订阅属性消息成功:', d2cResponseSub)
            } else {
                console.debug('baetyl订阅属性消息失败:', d2cResponseSub)
            }
        })

    })

    baetylCleint.on('connect', function () {
        console.log('baetylCleint客户端连接成功')
    })

    baetylCleint.on('disconnect', async function () {
        await wait(2000)
        baetylCleint.reconnect()
    })

    baetylCleint.on('error', async function (err) {
        console.log('baetyl客户端连接错误', err)
    })

    baetylCleint.on('message', function (topic, message) {
        console.log('从baetyl订阅到的消息：')
        console.log(topic, message.toString())

        try {
            let payloadRaw = JSON.parse(message.toString())
            let payload = {}
            let curTime = new Date().getTime()
            // 根据订阅的算法数据进行轨迹行踪
            if (topic === d2cResponseSub) {

                console.log('从baetyl收到一条属性上报消息')
                payload = {
                    "reqId": v4(),
                    "method": "thing.raw.post",
                    "version": "1.0",
                    "timestamp": 1610430718000,
                    "code": 200,
                    "description": "",
                    "bindName": "MAIN",
                    "params": payloadRaw
                }

                gwClient.d2cRawPost(payload)
                gwClient.d2cResponsePost(payload)

            }

            // 根据订阅机器人数据进行轨迹完成确认
            if (topic === propertySub) {

                console.log('从baetyl收到一条属性上报消息')
                payload = {
                    "reqId": v4(),
                    "method": "thing.property.post",
                    "version": "1.0",
                    "timestamp": curTime,
                    "bindName": "MAIN",
                    "properties": payloadRaw
                }

                gwClient.propertyPost(payload)
            }
        } catch (err) {
            console.error(err)
        }

    })

    /*
    
    订阅算法端 TOPIC：thing/CSCECREBARROBOT/202204070911001/response/d2c
    {
     "dev_id": "202204070911001",
     "pic_name": "chengz/1649754448_57.jpg",
     "pic_time": "2022-5-6 15:20:13",
     "pic_check_stat": 1,
    “dir_change_flag”: 1,
    }
    dir_change_flag: 运行方向，1 或者 0
    pic_check_stat：绑扎效果，1 代表成功，其余 0、-1 代表失败
    pic_name：绑扎效果图
    
    订阅机器人端 TOPIC：
    thing/CSCECREBARROBOT/202204070911001/property/post
    {
     "dev_id": "202204070911001",
     "pic_name": "chengz/1649754448_57.jpg",
     "pic_time": "2022-5-6 15:20:13",
     "pic_check_stat": 1,
    “dir_change_flag”: 1,
    }
    */

} else {
    const isUserName = process.env['baetyl_broker_username'] || false;

    let baetylCleint = {}
    let optionsBaetyl = {}

    // 判断baetylCleint鉴权方式，当环境变量中没有baetyl_broker_username字段时，默认为自签证书认证，读取baetyl应用内置证书
    if (!isUserName) {

        const KEY = fs.readFileSync('/var/lib/baetyl/system/certs/key.pem')
        const CERT = fs.readFileSync('/var/lib/baetyl/system/certs/crt.pem')
        const TRUSTED_CA_LIST = fs.readFileSync('/var/lib/baetyl/system/certs/ca.pem')

        console.debug('crt.pem', CERT)
        const HOST = process.env['baetyl_broker_host'] || 'baetyl-broker.baetyl-edge-system'
        const PORT = process.env['baetyl_broker_port'] || 50010
        optionsBaetyl = {
            port: PORT,
            host: HOST,
            key: KEY,
            cert: CERT,
            rejectUnauthorized: true,
            // The CA list will be used to determine if server is authorized
            ca: TRUSTED_CA_LIST,
            protocol: 'mqtts',
            clientId: v4()
        }

    } else {
        const HOST = process.env['baetyl_broker_host'] || '0.0.0.0'
        const PORT = process.env['baetyl_broker_port'] || 1883
        optionsBaetyl = {
            host: HOST,
            username: process.env['baetyl_broker_username'] || '',
            password: process.env['baetyl_broker_password'] || '',
            port: PORT,
            clientId: v4()
        }

    }

    baetylCleint = mqtt.connect(optionsBaetyl)


    // DMP客户端
    const entrypoint = process.env['entrypoint'];
    const productKey = process.env['productKey'];
    const deviceName = process.env['deviceName'];
    const deviceSecret = process.env['deviceSecret'];
    const instanceId = process.env['instanceId'];

    let gwClient = new GateWay(entrypoint, productKey, deviceName, deviceSecret, instanceId, baetylCleint)

    baetylCleint.on('connect', function () {

        baetylCleint.subscribe(process.env['baetyl_broker_report_topic'] || 'thing/+/+/property/post', function (err) {
            if (!err) {
                console.debug('baetyl订阅属性消息成功')
            } else {
                console.debug('baetyl订阅属性消息失败')
            }
        })
        baetylCleint.subscribe(process.env['baetyl_broker_event_topic'] || 'thing/+/+/event/post', function (err) {
            if (!err) {
                console.debug('baetyl订阅事件消息成功')
            } else {
                console.debug('baetyl订阅事件消息失败')
            }
        })

        // 兼容旧版topic，默认自动订阅老的topic
        baetylCleint.subscribe('$baetyl/device/+/report', function (err) {
            if (!err) {
                console.debug('baetyl订阅$baetyl/device/+/report消息成功')
            } else {
                console.debug('baetyl订阅$baetyl/device/+/report消息失败')
            }
        })

    })

    baetylCleint.on('connect', function () {
        console.log('baetylCleint客户端连接成功')
    })

    baetylCleint.on('disconnect', async function () {
        await wait(2000)
        baetylCleint.reconnect()
    })

    baetylCleint.on('error', async function (err) {
        console.log('baetyl客户端连接错误', err)
    })

    baetylCleint.on('message', function (topic, message) {
        console.log('从baetyl订阅到的消息：')
        console.log(topic, message.toString())

        try {
            let report = JSON.parse(message.toString())
            // console.log(report)
            if (report.content && report.content.blink && report.meta && report.meta.deviceProduct && report.meta.device) {

                if (topic.indexOf("property/post") != -1 || report.content.blink.properties) {

                    console.log('从baetyl收到一条属性上报消息')

                    let payload = report.content.blink
                    let subEquipment = {
                        productKey: report.meta.deviceProduct,
                        deviceName: report.meta.device
                    }
                    gwClient.propertyPostSub(payload, subEquipment)
                }

                if (topic.indexOf("event/post") != -1 || report.content.blink.events) {

                    console.log('从baetyl收到一条事件上报消息')

                    let payload = report.content.blink
                    let subEquipment = {
                        productKey: report.meta.deviceProduct,
                        deviceName: report.meta.device
                    }
                    gwClient.eventPostSub(payload, subEquipment)
                }

            } else {
                console.error('子设备消息格式错误')
            }
        } catch (err) {
            console.error(err)
        }

    })

    /*
    {
       "kind":"deviceReport",
       "meta":{
           "accessTemplate":"xw-modbus-access-template",
           "device":"xw-mod-1",
           "deviceProduct":"modbus-simulator-20220728",
           "node":"node的名称",
           "nodeProduct":"固定值"
       },
       "content":{
           "blink":{
               "reqId":"033cc79a-6adf-4d40-b5a1-3ff33693f19c",//uuid，保证唯一即可
               "method":"thing.event.post",//固定值，就是这个值
               "version":"1.0",//固定值，就是这个值
               "timestamp":1659003513995,
               "properties":{
                   "temperature":27.1,
                   "humidity":22,
                   "switch":"on/off"
               }
           }
       }
    }
    */
}
