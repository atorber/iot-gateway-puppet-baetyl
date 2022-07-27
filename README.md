# iot-gateway-puppet-baetyl

baetyl子设备消息北向对接DMP边缘应用

## 本地快速开始

本地运行通过设置外部mqtt broker模拟baetyl-broker进行调试，在本地通过iotcore提供的mqtt-broker代替baetyl-broker

1. 环境准备，安装nodejs > 16,下载本项目，安装依赖

```
npm install
```

2. 设置baetyl-broker client信息环境变量

```
export baetyl_broker_host="xxxx"
export baetyl_broker_username="xxxx"
export baetyl_broker_password="xxxx"
export baetyl_broker_port="xxxx"
export baetyl_broker_report_topic="xxxx"
```

对照代码位置

```
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
```

3. 设置DMP配置相关的环境变量,此处所有配置从DMP中获得

```
export entrypoint="http://180.76.145.103:8372"
export productKey="cgateway"
export deviceName="bietest001"
export deviceSecret="zqjxba22s4h4rbj945jp"
export instanceId="zasr9fjmk53aur26"
```

4. 启动程序

```
npm start
```

5. 模拟baetyl向所设置的baetyl_broker_report_topic中发布如下消息

```
{
    "kind":"deviceReport",
    "meta":{
        "device":"biesubdevice001",
        "deviceModel":"THM",
        "accessTemplate":"接入模板"
    },
    "content":{
        "temperature":10,
        "dmp":{
            "reqId":"442c1da4-9d3a-4f9b-a6e9-bfe858e4ac43",
            "method":"thing.event.post",
            "version":"1.0",
            "timestamp":1610430718000,
            "bindName":"MAIN",
            "events":{
                "bie":{
                    "temperature":24,
                    "humidity":30
                }
            }
        }
    }
}
```

## docker下运行

1. 打包docker镜像

```
docker build -t iot-gateway-puppet-baetyl -f DockerFile .
```

2. 运行docker

> 在baetyl中部署运行时不需要再设置外部mqtt-broker

```
docker run --env entrypoint="http://180.76.145.103:8372" --env productKey="cgateway" --env deviceName="bietest001" --env deviceSecret="zqjxba22s4h4rbj945jp" --env instanceId="zasr9fjmk53aur26" iot-gateway-puppet-baetyl:latest
```

## 从dockerhub拉取镜像

```
docker push atorber/iot-gateway-puppet-baetyl:latest
```
