
/*
本示例可以模拟网关设备连接物联网平台并上报周期上报当前运行程序的计算的运行状态。
签名算法说明：
1、将接口路径、分钟级时间戳和请求参数（body的JOSN字符串）拼接成待加密字符串authStringPrefix，参数之间以换行符"\n"连接，没有请求参数时，填"null"
示例：
    /v1/devices/zfm8n1p5y1qzc09a/test01/test01/resources
    26944410
    {"resourceType":"MQTT"}
    或
    /v1/devices/zfm8n1p5y1qzc09a/test01/test01/resources
    26944410
    null

2、分别获取deviceSecret、authStringPrefix的字节数组
3、使用deviceSecret数组对上述字符串数组使用HmacSHA256进行加密
4、将加密后的byte数组进行Base64编码得到signature，并进行urlencode处理
5、将最终得到的signature和分钟级时间戳放到请求的header中
不同编程语言实现签名算法时，对字符串的处理方法存在差异，例如使用python时以下两点需特别注意（nodejs则不存在此问题）：
- body json string不要带空格，如python的json.dumps()为了美观会加上空格，导致鉴权失败，请指定参数separators=(',',':')
- urlencode处理时需对全部字符进行转换，如python中使用urllib.parse.quote()时默认不对‘/’进行编码，需要是应用urllib.parse.quote('待转换字符串', safe='')
*/

const crypto = require('crypto');
const urlencode = require('urlencode')
const rp = require('request-promise')

class Auth {
    constructor(entrypoint, productKey, deviceName, deviceSecret, instanceId) {
        this.entrypoint = entrypoint;
        this.productKey = productKey;
        this.deviceName = deviceName;
        this.deviceSecret = deviceSecret;
        this.instanceId = instanceId;
    }
    async getResources() {
        let expiryTime = String(Math.floor(new Date().getTime() / (1000 * 60)))
        let body = { "resourceType": "MQTT", "permanentConnect": true }
        let path = `/v1/devices/${this.instanceId}/${this.productKey}/${this.deviceName}/resources`

        // 获取签名
        let signature = this.sign(path, expiryTime, JSON.stringify(body))

        const query = {}
        const method = 'POST'

        let headers = {}
        headers['Content-Type'] = "application/json"
        headers['signature'] = signature
        headers['expiryTime'] = expiryTime

        var uri = `${this.entrypoint}${path}`

        let opt = {
            method,
            uri,
            qs: query,
            body,
            headers,
            json: true
        }

        let res = ''
        try {
            let r = await rp(opt)
            // console.log(r)
            res = r.content
        } catch (err) {
            console.error(err.error)
            res = err
        }

        return res
    }

    sign(path, expiryTime, body) {
        let authStringPrefix = `${path}\n${expiryTime}\n${body}`
        let deviceSecretBytes = Buffer.from(this.deviceSecret) // 获取密钥字节数组
        authStringPrefix = Buffer.from(authStringPrefix) // 获取拼接字符串字节数组
        let obj = crypto.createHmac('sha256', deviceSecretBytes);
        let signature = obj.update(authStringPrefix, 'utf-8')  // 对拼接字符串进行HmacSHA256加密，获取加密字节数组
        signature = signature.digest('base64')  // 将加密得到的字节数组进行base64编码
        signature = urlencode(signature)
        // console.log('获得的设备签名', signature)
        return signature
    }
}

exports = module.exports = {
    Auth
}
