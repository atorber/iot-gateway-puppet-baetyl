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

const isUserName = process.env['baetyl_broker_username'] || false;

let baetylCleint = {}
let optionsBaetyl = {}

// 判断baetylCleint鉴权方式，当环境变量中没有baetyl_broker_username字段时，默认为自签证书认证，读取baetyl应用内置证书
if (!isUserName) {

    const KEY = fs.readFileSync('/var/lib/baetyl/system/certs/key.pem')
    const CERT = fs.readFileSync('/var/lib/baetyl/system/certs/crt.pem')
    const TRUSTED_CA_LIST = fs.readFileSync('/var/lib/baetyl/system/certs/ca.pem')

    console.debug('crt.pem', CERT)
    const HOST = process.env['baetyl_broker_host'] || 'ssl://baetyl-broker.baetyl-edge-system'
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