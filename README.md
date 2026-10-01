# Bluetooth_Hat

แอป React Native/Expo สำหรับงาน Bluetooth Low Energy (BLE) ที่เชื่อมต่อกับอุปกรณ์ของรายวิชา แล้วทำขั้นตอน:

1. อ่านค่า Characteristic ครั้งแรก
2. เขียนชื่อผู้ใช้และเพื่อนลงใน Characteristic
3. อ่านค่าอีกครั้งเพื่อรับผลทำนายเกรด

## Target UUIDs

```text
SERVICE_UUID = aee04821-1973-4e1f-a590-e84b10d580e7
CHAR_UUID    = cde07b1a-889b-44b7-a99f-c888dddac729
```

## Features

- สแกนอุปกรณ์ BLE ทุกตัวในระยะ
- จัดอุปกรณ์ที่ประกาศ Service UUID เป้าหมายไว้บนสุด
- กรองรายการเป็น Target หรือ All และค้นหาจากชื่อ/Device ID
- ตรวจ Service และ Characteristic หลังเชื่อมต่อ
- ขั้นตอน Read -> Write -> Read สำหรับงานทำนายเกรด
- แสดงสถานะสแกน กำลังเชื่อมต่อ และเชื่อมต่อสำเร็จ
- เปลี่ยนภาษาไทย/อังกฤษได้
- ธีมหมวกพยากรณ์เกรด

## Install

```bash
npm install
```

โปรเจกต์ใช้ `react-native-ble-plx` ซึ่งเป็น native module จึงต้องใช้งานผ่าน development build หรือ APK ที่ build ด้วย EAS

## Development

```bash
npx expo start --dev-client
```

## Android Preview APK

```bash
npx eas-cli@latest build --platform android --profile preview
```

โปรเจกต์นี้พัฒนาต่อจากตัวอย่าง [soradech/scan-ble](https://github.com/soradech/scan-ble)
