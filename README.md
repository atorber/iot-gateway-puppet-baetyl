# iot-gateway-puppet

物联网平台MQTT2MQTT协议转换对接代理服务框架，支持以下协议转换：

- 百度智能边缘baetyl子设备消息对接DMP

- 82bot对接DMP

- TBD DMP透传消息解析为Blink（MQTT网桥实现）

## 本地快速开始

### baetyl对接DMP

本地运行通过设置外部mqtt broker模拟baetyl-broker进行调试，在本地通过iotcore提供的mqtt-broker代替baetyl-broker(在baetyl中运行时不需要配置`baetyl_broker_`开头的环境变量，程序直接使用baetyl内置的证书进行连接鉴权)

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
export baetyl_broker_event_topic="xxxx"
```

对照代码位置

```
//  启动baetyl客户端
const optionsBaetyl = {
    host: process.env['baetyl_broker_host']||'0.0.0.0',
    username: process.env['baetyl_broker_username']||'',
    password: process.env['baetyl_broker_password']||'',
    port: process.env['baetyl_broker_port']||1883,
    clientId: v4()
}

 const baetylCleint = mqtt.connect(optionsBaetyl)

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
```
### 82bot对接DMP

设置环境变量 `export puppet="82mqtt"`,其余环境变量不变

    82MQTT client信息环境变量

    ```
    export puppet="82mqtt"
    export baetyl_broker_host="xxxx"
    export baetyl_broker_username="xxxx"
    export baetyl_broker_password="xxxx"
    export baetyl_broker_port="xxxx"
    ```

    设置DMP配置相关的环境变量,此处所有配置从DMP中获得

    ```
    export entrypoint="http://180.76.145.103:8372"
    export productKey="cgateway"
    export deviceName="bietest001"
    export deviceSecret="zqjxba22s4h4rbj945jp"
    export instanceId="zasr9fjmk53aur26"
    ```

    启动程序

    `npm start`

## docker下运行

1. 打包docker镜像

```
docker build -t iot-gateway-puppet-baetyl .
```

2. 运行docker

> 在baetyl中部署运行时不需要再设置外部mqtt-broker，将环境变量替换为实际的设备配置

```
docker run --env entrypoint="http://180.76.145.103:8372" --env productKey="cgateway" --env deviceName="bietest001" --env deviceSecret="zqjxba22s4h4rbj945jp" --env instanceId="zasr9fjmk53aur26" iot-gateway-puppet-baetyl:latest
```

## 从dockerhub拉取镜像

1. 拉取镜像

```
docker pull atorber/iot-gateway-puppet-baetyl:latest
```

2. 运行

> 将环境变量替换为实际的设备配置

- baetyl

```
docker run --env entrypoint="http://180.76.145.103:8372" --env productKey="cgateway" --env deviceName="bietest001" --env deviceSecret="zqjxba22s4h4rbj945jp" --env instanceId="zasr9fjmk53aur26" atorber/iot-gateway-puppet-baetyl:latest
```

> 默认使用应用证书连接,不需要配置baetyl_broker相关环境变量

- 82bot

```
docker run --env puppet="82mqtt" --env baetyl_broker_host="xxxx" --env baetyl_broker_username="xxxx" --env baetyl_broker_password="xxxx" --env baetyl_broker_port="xxxx" --env entrypoint="http://180.76.145.103:8372" --env productKey="cgateway" --env deviceName="bietest001" --env deviceSecret="zqjxba22s4h4rbj945jp" --env instanceId="zasr9fjmk53aur26" atorber/iot-gateway-puppet-baetyl:latest
```

## 更新日志

2022-10-17

- 增加对82机器人接入的支持，设置环境变量 `export puppet="82mqtt"`,其余环境变量不变
