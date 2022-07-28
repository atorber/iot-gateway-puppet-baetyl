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
 let baetylCleint = mqtt.connect({
    host: process.env['baetyl_broker_host']||'0.0.0.0',
    username: process.env['baetyl_broker_username']||'',
    password: process.env['baetyl_broker_password']||'',
    port: process.env['baetyl_broker_port']||1883,
    clientId: v4()
})
 
 baetylCleint.on('connect', function () {
     baetylCleint.subscribe(process.env['baetyl_broker_report_topic']||'$baetyl/device/+/report', function (err) {
         if (!err) {
             console.debug('baetyl订阅消息成功')
         } else {
             console.debug('baetyl订阅消息失败')
         }
     })
 })
 
 baetylCleint.on('message', function (topic, message) {
     console.log('从baetyl接收到的消息：')
     console.log(topic,message.toString())
     let report = JSON.parse(message.toString())
     // console.log(report)
     let payload = report.content.dmp
     let subEquipment = {
         productKey: report.meta.deviceModel,
         deviceName: report.meta.device
     }
     gwClient.eventPostSub(payload, subEquipment)
 })