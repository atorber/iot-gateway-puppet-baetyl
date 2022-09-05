import { type } from "os"

type deviceType = 'DIRECT' | 'GATEWAY' | 'SUBDEVICE'

type deviceOption = {
    entryPoint: string,
    instanceId: string,
    productKey: string,
    deviceName: string
    deviceSecret: string,
    deviceType? : deviceType
}

export {
    deviceType,
    deviceOption
}