/**
 * baetyl-broker转dmp
 */

 const { v4 } = require('uuid')
 const mqtt = require('mqtt')
 const { GateWay } = require('./gateway')
 
 const entrypoint = process.env['entrypoint'];
 const productKey = process.env['productKey'];
 const deviceName = process.env['deviceName'];
 const deviceSecret = process.env['deviceSecret'];
 const instanceId = process.env['instanceId'];
 
 let gwClient = new GateWay(entrypoint, productKey, deviceName, deviceSecret, instanceId)
 
//  启动baetyl客户端
const optionsBaetyl = {
    host: process.env['baetyl_broker_host']||'0.0.0.0',
    username: process.env['baetyl_broker_username']||'',
    password: process.env['baetyl_broker_password']||'',
    port: process.env['baetyl_broker_port']||1883,
    clientId: v4()
}

 const baetylCleint = mqtt.connect(optionsBaetyl)
 
 baetylCleint.on('connect', function () {
     baetylCleint.subscribe(process.env['baetyl_broker_report_topic']||'thing/+/+/property/post', function (err) {
         if (!err) {
             console.debug('baetyl订阅属性消息成功')
         } else {
             console.debug('baetyl订阅属性消息失败')
         }
     })
     baetylCleint.subscribe(process.env['baetyl_broker_event_topic']||'thing/+/+/event/post', function (err) {
        if (!err) {
            console.debug('baetyl订阅事件消息成功')
        } else {
            console.debug('baetyl订阅事件消息失败')
        }
    })
     
 })

 baetylCleint.on('disconnect',function(){
    baetylCleint.reconnect()
 })
 
 baetylCleint.on('message', function (topic, message) {
     console.log('从baetyl接收到的消息：')
     console.log(topic,message.toString())
     let report = JSON.parse(message.toString())
     // console.log(report)
     if(report.content&&report.content.blink&&report.meta&&report.meta.deviceProduct&&report.meta.device){

        if(topic.indexOf("property/post") != -1){

            console.log('收到一条属性消息')

            let payload = report.content.blink
            let subEquipment = {
                productKey: report.meta.deviceProduct,
                deviceName: report.meta.device
            }
            gwClient.propertyPostSub(payload, subEquipment)
        }

        if(topic.indexOf("event/post") != -1){

            console.log('收到一条事件消息')
        
            let payload = report.content.blink
            let subEquipment = {
                productKey: report.meta.deviceProduct,
                deviceName: report.meta.device
            }
            gwClient.eventPostSub(payload, subEquipment)
        }

     }else{
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