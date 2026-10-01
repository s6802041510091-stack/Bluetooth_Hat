import { Buffer } from 'buffer';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const manager = new BleManager();

const SERVICE_UUID = 'aee04821-1973-4e1f-a590-e84b10d580e7';
const CHAR_UUID = 'cde07b1a-889b-44b7-a99f-c888dddac729';
const SCAN_DURATION_MS = 12000;

const colors = {
  midnight: '#090B18',
  navy: '#11152A',
  navyLight: '#1A2038',
  parchment: '#F4E7C5',
  parchmentMuted: '#CBBE9B',
  gold: '#D7AF52',
  goldBright: '#F0D58B',
  burgundy: '#651E2E',
  burgundyLight: '#8D3044',
  emerald: '#3E8A68',
  ink: '#231B17',
  white: '#FFFDF6',
};

type Language = 'th' | 'en';
type DeviceFilter = 'target' | 'all';

const translations = {
  th: {
    unknownDevice: 'อุปกรณ์ปริศนา',
    scanOverlayTitle: 'หมวกกำลังสัมผัสเวทมนตร์...',
    connectOverlayTitle: 'กำลังเปิดประตูเชื่อมต่อ...',
    scanningOnly: 'กำลังค้นหาอุปกรณ์ BLE ทุกตัวในระยะ\nอุปกรณ์เป้าหมายจะถูกจัดไว้บนสุด',
    checkingDevice: (name: string) => `กำลังตรวจสอบอุปกรณ์\n${name}`,
    foundCount: (count: number) => `พบอุปกรณ์ ${count} เครื่อง`,
    cancelScan: 'หยุดค้นหา',
    ready: 'เปิด Bluetooth แล้วเริ่มพิธีค้นหาอุปกรณ์',
    scanFinished: 'ค้นหาเสร็จแล้ว เลือกอุปกรณ์เพื่อเชื่อมต่อ',
    permissionStatus: 'ยังไม่ได้รับอนุญาตให้ค้นหาอุปกรณ์ใกล้เคียง',
    permissionTitle: 'ต้องการสิทธิ์เพิ่มเติม',
    permissionBody: 'กรุณาอนุญาต Nearby devices และ Location แล้วลองใหม่อีกครั้ง',
    bluetoothStatus: 'Bluetooth ปิดอยู่หรือยังไม่พร้อมใช้งาน',
    bluetoothTitle: 'ยังไม่ได้เปิด Bluetooth',
    bluetoothBody: 'กรุณาเปิด Bluetooth แล้วลองใหม่',
    scanningStatus: 'กำลังค้นหาอุปกรณ์ BLE ทุกตัวในระยะ...',
    scanFailed: 'ค้นหาไม่สำเร็จ',
    connecting: 'กำลังเชื่อมต่อ...',
    connectFailed: 'เชื่อมต่อไม่สำเร็จ',
    connectFailedStatus: 'เชื่อมต่อไม่ได้ กรุณาค้นหาและเลือกอุปกรณ์ใหม่',
    emptyValue: '(ไม่มีข้อความ)',
    readFailed: 'อ่านค่าไม่สำเร็จ',
    missingNamesTitle: 'ยังไม่ได้ใส่ชื่อ',
    missingNamesBody: 'กรุณาใส่ชื่อคุณและเพื่อนก่อนส่งให้หมวก',
    namesReceived: 'หมวกได้รับชื่อแล้ว พร้อมเปิดคำทำนาย',
    writeSuccessTitle: 'ส่งชื่อสำเร็จ ✦',
    writeSuccessBody: 'หมวกได้รับชื่อแล้ว กดขั้นที่ 3 เพื่อเปิดคำทำนายเกรด',
    writeFailed: 'ส่งชื่อไม่สำเร็จ',
    disconnectedStatus: 'ออกจากพิธีแล้ว กดค้นหาเพื่อเริ่มใหม่',
    signal: (rssi: number | null) => `พลังสัญญาณ ${rssi ?? 'ไม่ทราบ'} dBm`,
    cannotConnect: 'เชื่อมต่อไม่ได้',
    targetBadge: 'เป้าหมาย',
    connectedVerified: 'เชื่อมต่อสำเร็จ • UUID ถูกต้อง',
    connectedGeneral: 'เชื่อมต่อสำเร็จ • อุปกรณ์ทั่วไป',
    generalConnectionTitle: 'เชื่อมต่ออุปกรณ์แล้ว',
    generalConnectedQuote: (name: string) => `เชื่อมต่อกับ ${name} สำเร็จ`,
    generalDeviceTitle: 'ไม่พบช่องสื่อสารสำหรับทำนายเกรด',
    generalDeviceDescription:
      'อุปกรณ์นี้เชื่อมต่อได้ แต่ไม่มี Service และ Characteristic ของอาจารย์ จึงยังใช้ขั้นตอนอ่าน–เขียน–อ่านของงานนี้ไม่ได้',
    generalDeviceHint: 'คุณสามารถตัดการเชื่อมต่อ แล้วเลือกอุปกรณ์อื่นจากหน้าค้นหาได้',
    ceremonyTitle: 'พิธีพยากรณ์เกรด',
    connectedQuote: (name: string) => `“ข้ากำลังฟัง... ${name}”`,
    predictionLabel: 'คำพยากรณ์ของหมวก',
    characteristicLabel: 'เสียงจาก Characteristic',
    hiddenPrediction: 'คำทำนายยังซ่อนอยู่ในเงามืด...',
    step1Title: 'ฟังเสียงเดิมจากหมวก',
    step1Description: 'อ่านค่า Characteristic ครั้งแรก',
    readDone: 'อ่านค่าแล้ว',
    readFirst: 'อ่านค่าแรก',
    step2Title: 'กระซิบชื่อให้หมวก',
    step2Description: 'ใส่ชื่อคุณและเพื่อนของคุณ',
    namesPlaceholder: 'เช่น Harry และ Ron',
    sendNames: 'ส่งชื่อให้หมวก',
    step1Hint: 'ทำขั้นที่ 1 ก่อนเพื่อปลดล็อกขั้นนี้',
    step3Title: 'เปิดคำพยากรณ์',
    step3Description: 'อ่านค่าอีกครั้งเพื่อดูเกรด',
    thinking: 'หมวกกำลังคิด...',
    revealPrediction: 'เผยคำทำนายเกรด',
    step2Hint: 'ส่งชื่อในขั้นที่ 2 ก่อนเพื่อเปิดคำทำนาย',
    disconnect: 'ออกจากพิธีและตัดการเชื่อมต่อ',
    heroTitle: 'หมวกพยากรณ์เกรด',
    heroQuote: '“จงนำอุปกรณ์เข้ามาใกล้ แล้วข้าจะค้นหาคำตอบที่ซ่อนอยู่...”',
    connectionStatus: 'สถานะการเชื่อมต่อ',
    targetTitle: 'อุปกรณ์เป้าหมายของรายวิชา',
    targetDescription: 'แอปจะแสดงอุปกรณ์ BLE ทุกตัว และจัดอุปกรณ์ที่ประกาศ UUID นี้ไว้บนสุด',
    startScan: '✦ เริ่มค้นหาอุปกรณ์ Bluetooth',
    matchedDevices: 'อุปกรณ์ที่ตรวจพบ',
    filterTitle: 'กรองรายการอุปกรณ์',
    targetFilter: 'เป้าหมาย',
    allFilter: 'ทั้งหมด',
    searchPlaceholder: 'ค้นหาจากชื่อหรือ Device ID',
    resultCount: (visible: number, total: number) => `แสดง ${visible} จาก ${total}`,
    targetNotFoundTitle: 'ยังไม่พบอุปกรณ์เป้าหมาย',
    targetNotFoundDescription: (otherCount: number) =>
      otherCount > 0
        ? `พบอุปกรณ์ BLE อื่น ${otherCount} เครื่อง แต่ยังไม่มีเครื่องที่ประกาศ Service UUID ของอาจารย์ ลองขยับเข้าใกล้อุปกรณ์แล้วค้นหาใหม่ หรือเลือก “ทั้งหมด” เพื่อดูรายการอื่น`
        : 'ยังไม่พบอุปกรณ์ที่ประกาศ Service UUID ของอาจารย์ ลองเปิดอุปกรณ์ ขยับเข้าใกล้ แล้วค้นหาใหม่',
    searchNotFoundTitle: 'ไม่พบอุปกรณ์ที่ค้นหา',
    searchNotFoundDescription: 'ลองตรวจคำค้นหา หรือเลือกดูอุปกรณ์ทั้งหมด',
    emptyTitle: 'ยังไม่พบร่องรอยเวทมนตร์',
    emptyDescription:
      'เปิดอุปกรณ์ BLE ที่ต้องการ แล้วนำมาไว้ใกล้โทรศัพท์ก่อนเริ่มค้นหา',
    scanCancelled: 'หยุดค้นหาแล้ว กดเริ่มค้นหาเมื่อต้องการลองใหม่',
  },
  en: {
    unknownDevice: 'Mysterious device',
    scanOverlayTitle: 'The hat is sensing nearby magic...',
    connectOverlayTitle: 'Opening the connection gateway...',
    scanningOnly: 'Searching for every BLE device in range\nThe target device will stay at the top',
    checkingDevice: (name: string) => `Verifying device\n${name}`,
    foundCount: (count: number) => `${count} device${count === 1 ? '' : 's'} found`,
    cancelScan: 'Stop searching',
    ready: 'Turn on Bluetooth, then begin the device ceremony',
    scanFinished: 'Search complete. Choose a device to connect',
    permissionStatus: 'Nearby device permission has not been granted',
    permissionTitle: 'Permission required',
    permissionBody: 'Allow Nearby devices and Location, then try again.',
    bluetoothStatus: 'Bluetooth is off or unavailable',
    bluetoothTitle: 'Bluetooth is off',
    bluetoothBody: 'Turn on Bluetooth, then try again.',
    scanningStatus: 'Searching for every BLE device in range...',
    scanFailed: 'Search failed',
    connecting: 'Connecting...',
    connectFailed: 'Connection failed',
    connectFailedStatus: 'Could not connect. Search and choose a device again.',
    emptyValue: '(empty value)',
    readFailed: 'Read failed',
    missingNamesTitle: 'Names required',
    missingNamesBody: 'Enter your name and your buddy before speaking to the hat.',
    namesReceived: 'The hat received the names and is ready to reveal its prediction.',
    writeSuccessTitle: 'Names delivered ✦',
    writeSuccessBody: 'The hat received the names. Continue to step 3 to reveal the predicted grade.',
    writeFailed: 'Write failed',
    disconnectedStatus: 'The ceremony has ended. Search to begin again.',
    signal: (rssi: number | null) => `Signal strength ${rssi ?? 'unknown'} dBm`,
    cannotConnect: 'Not connectable',
    targetBadge: 'TARGET',
    connectedVerified: 'Connected • UUID verified',
    connectedGeneral: 'Connected • General device',
    generalConnectionTitle: 'Device connected',
    generalConnectedQuote: (name: string) => `Connected to ${name}`,
    generalDeviceTitle: 'Grade prediction channel not found',
    generalDeviceDescription:
      "This device is connected, but it does not provide the teacher's Service and Characteristic. The assignment's read–write–read steps are unavailable for this device.",
    generalDeviceHint: 'Disconnect and choose another device from the scanner whenever you are ready.',
    ceremonyTitle: 'Grade Prediction Ceremony',
    connectedQuote: (name: string) => `“I am listening... ${name}”`,
    predictionLabel: "The hat's prediction",
    characteristicLabel: 'Characteristic voice',
    hiddenPrediction: 'The prediction remains hidden in the shadows...',
    step1Title: "Hear the hat's first message",
    step1Description: 'Read the Characteristic for the first time',
    readDone: 'First value read',
    readFirst: 'Read first value',
    step2Title: 'Whisper your names to the hat',
    step2Description: "Enter your name and your buddy's name",
    namesPlaceholder: 'Example: Harry and Ron',
    sendNames: 'Send names to the hat',
    step1Hint: 'Complete step 1 to unlock this step',
    step3Title: 'Reveal the prediction',
    step3Description: 'Read again to receive the predicted grade',
    thinking: 'The hat is thinking...',
    revealPrediction: 'Reveal predicted grade',
    step2Hint: 'Send the names in step 2 to unlock the prediction',
    disconnect: 'Leave the ceremony and disconnect',
    heroTitle: 'The Grade Oracle Hat',
    heroQuote: '“Bring the device closer, and I shall seek the answer hidden within...”',
    connectionStatus: 'Connection status',
    targetTitle: 'Class target device',
    targetDescription: 'All BLE devices are shown. Devices advertising this UUID are pinned to the top.',
    startScan: '✦ Search for Bluetooth devices',
    matchedDevices: 'Discovered devices',
    filterTitle: 'Filter devices',
    targetFilter: 'Target',
    allFilter: 'All',
    searchPlaceholder: 'Search by name or Device ID',
    resultCount: (visible: number, total: number) => `Showing ${visible} of ${total}`,
    targetNotFoundTitle: 'Target device not found yet',
    targetNotFoundDescription: (otherCount: number) =>
      otherCount > 0
        ? `${otherCount} other BLE device${otherCount === 1 ? '' : 's'} found, but none advertise the teacher's Service UUID. Move closer and scan again, or choose “All” to see them.`
        : "No device is advertising the teacher's Service UUID yet. Turn it on, move closer, and scan again.",
    searchNotFoundTitle: 'No matching device',
    searchNotFoundDescription: 'Check the search text or switch to all devices.',
    emptyTitle: 'No magical trace found yet',
    emptyDescription:
      'Turn on a BLE device and bring it close to this phone before starting a search.',
    scanCancelled: 'Search stopped. Begin again whenever you are ready.',
  },
} as const;

const stars = [
  { top: '4%', left: '8%', size: 16 },
  { top: '9%', left: '82%', size: 10 },
  { top: '20%', left: '92%', size: 18 },
  { top: '28%', left: '5%', size: 9 },
  { top: '44%', left: '88%', size: 12 },
  { top: '61%', left: '10%', size: 14 },
  { top: '75%', left: '94%', size: 9 },
  { top: '91%', left: '16%', size: 11 },
] as const;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getDeviceName(device: Device, language: Language) {
  return device.name ?? device.localName ?? translations[language].unknownDevice;
}

function advertisesTargetService(device: Device) {
  return (
    device.serviceUUIDs?.some(
      (uuid) => uuid.toLowerCase() === SERVICE_UUID.toLowerCase(),
    ) ?? false
  );
}

function MagicBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map((star, index) => (
        <Text
          key={`${star.top}-${star.left}`}
          style={[
            styles.star,
            {
              top: star.top,
              left: star.left,
              fontSize: star.size,
              opacity: index % 2 === 0 ? 0.7 : 0.38,
            },
          ]}>
          ✦
        </Text>
      ))}
    </View>
  );
}

type MagicButtonProps = {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
};

function MagicButton({
  children,
  onPress,
  disabled = false,
  secondary = false,
}: MagicButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.magicButton,
        secondary && styles.magicButtonSecondary,
        disabled && styles.magicButtonDisabled,
        pressed && !disabled && styles.magicButtonPressed,
      ]}>
      <Text
        style={[
          styles.magicButtonText,
          secondary && styles.magicButtonSecondaryText,
        ]}>
        {children}
      </Text>
    </Pressable>
  );
}

type LanguageToggleProps = {
  language: Language;
  onChange: (language: Language) => void;
};

function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <View accessibilityRole="tablist" style={styles.languageToggle}>
      {(['th', 'en'] as const).map((option) => {
        const selected = language === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={[
              styles.languageOption,
              selected && styles.languageOptionSelected,
            ]}>
            <Text
              style={[
                styles.languageOptionText,
                selected && styles.languageOptionTextSelected,
              ]}>
              {option.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type WaitingOverlayProps = {
  visible: boolean;
  mode: 'scan' | 'connect';
  foundCount: number;
  deviceName?: string;
  language: Language;
  onCancel?: () => void;
};

function WaitingOverlay({
  visible,
  mode,
  foundCount,
  deviceName,
  language,
  onCancel,
}: WaitingOverlayProps) {
  const isScan = mode === 'scan';
  const t = translations[language];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <MagicBackground />
        <View style={styles.overlayCard}>
          <Text style={styles.overlaySparkle}>✦ ･ ｡ﾟ✧ ･ ✦</Text>
          <Text style={styles.hatLarge}>🎩</Text>
          <ActivityIndicator size="large" color={colors.goldBright} />
          <Text style={styles.overlayTitle}>
            {isScan ? t.scanOverlayTitle : t.connectOverlayTitle}
          </Text>
          <Text style={styles.overlayDescription}>
            {isScan
              ? t.scanningOnly
              : t.checkingDevice(deviceName ?? t.unknownDevice)}
          </Text>
          {isScan && (
            <View style={styles.foundPill}>
              <Text style={styles.foundPillText}>{t.foundCount(foundCount)}</Text>
            </View>
          )}
          {isScan && onCancel && (
            <Pressable onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{t.cancelScan}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<Language>('th');
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('target');
  const [searchQuery, setSearchQuery] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [connectedToTarget, setConnectedToTarget] = useState(false);
  const [receivedData, setReceivedData] = useState('');
  const [writeValue, setWriteValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingName, setConnectingName] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [hasInitialReading, setHasInitialReading] = useState(false);
  const [hasWritten, setHasWritten] = useState(false);
  const [hasPrediction, setHasPrediction] = useState(false);
  const [scanMessage, setScanMessage] = useState<string>(
    translations.th.ready,
  );
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = translations[language];

  const isTargetDevice = (device: Device) => advertisesTargetService(device);

  const sortDevices = (items: Device[]) =>
    [...items].sort((first, second) => {
      const targetDifference =
        Number(isTargetDevice(second)) - Number(isTargetDevice(first));

      if (targetDifference !== 0) return targetDifference;
      return (second.rssi ?? -999) - (first.rssi ?? -999);
    });

  const targetDeviceCount = devices.filter(isTargetDevice).length;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredDevices = devices.filter((device) => {
    if (deviceFilter === 'target' && !isTargetDevice(device)) return false;
    if (!normalizedSearchQuery) return true;

    const searchableText = [device.name, device.localName, device.id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchableText.includes(normalizedSearchQuery);
  });

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setScanMessage(translations[nextLanguage].ready);
    setReceivedData((currentValue) => {
      if (
        currentValue === translations.th.namesReceived ||
        currentValue === translations.en.namesReceived
      ) {
        return translations[nextLanguage].namesReceived;
      }
      if (
        currentValue === translations.th.emptyValue ||
        currentValue === translations.en.emptyValue
      ) {
        return translations[nextLanguage].emptyValue;
      }
      return currentValue;
    });
  };

  const clearScanTimer = () => {
    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
      scanTimer.current = null;
    }
  };

  const stopScan = (message?: string) => {
    manager.stopDeviceScan();
    clearScanTimer();
    setIsScanning(false);
    setScanMessage(message ?? t.scanFinished);
  };

  async function requestPermissions() {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
      clearScanTimer();
    };
  }, []);

  const resetCeremony = () => {
    setReceivedData('');
    setWriteValue('');
    setHasInitialReading(false);
    setHasWritten(false);
    setHasPrediction(false);
  };

  const startScan = async () => {
    try {
      const granted = await requestPermissions();
      if (!granted) {
        setScanMessage(t.permissionStatus);
        Alert.alert(t.permissionTitle, t.permissionBody);
        return;
      }

      const bluetoothState = await manager.state();
      if (bluetoothState !== State.PoweredOn) {
        setScanMessage(t.bluetoothStatus);
        Alert.alert(t.bluetoothTitle, t.bluetoothBody);
        return;
      }

      manager.stopDeviceScan();
      clearScanTimer();
      setDevices([]);
      setIsScanning(true);
      setScanMessage(t.scanningStatus);

      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          stopScan(`${t.scanFailed}: ${error.message}`);
          Alert.alert(t.scanFailed, error.message);
          return;
        }

        if (!device) return;

        setDevices((currentDevices) => {
          const existingIndex = currentDevices.findIndex(
            (currentDevice) => currentDevice.id === device.id,
          );

          if (existingIndex === -1) {
            return sortDevices([...currentDevices, device]);
          }

          const updatedDevices = [...currentDevices];
          updatedDevices[existingIndex] = device;
          return sortDevices(updatedDevices);
        });
      });

      scanTimer.current = setTimeout(() => stopScan(), SCAN_DURATION_MS);
    } catch (error) {
      const message = getErrorMessage(error);
      stopScan(`${t.scanFailed}: ${message}`);
      Alert.alert(t.scanFailed, message);
    }
  };

  const connectToDevice = async (device: Device) => {
    stopScan(t.connecting);
    setConnectingName(getDeviceName(device, language));
    setIsConnecting(true);

    try {
      const connected = await manager.connectToDevice(device.id);
      const discovered = await connected.discoverAllServicesAndCharacteristics();
      const services = await manager.servicesForDevice(discovered.id);
      const hasTargetService = services.some(
        (service) => service.uuid.toLowerCase() === SERVICE_UUID.toLowerCase(),
      );

      let hasTargetCharacteristic = false;
      if (hasTargetService) {
        const characteristics = await manager.characteristicsForDevice(
          discovered.id,
          SERVICE_UUID,
        );
        hasTargetCharacteristic = characteristics.some(
          (characteristic) =>
            characteristic.uuid.toLowerCase() === CHAR_UUID.toLowerCase(),
        );
      }

      resetCeremony();
      setConnectedToTarget(hasTargetCharacteristic);
      setConnectedDevice(discovered);
    } catch (error) {
      try {
        await manager.cancelDeviceConnection(device.id);
      } catch {
        // The connection may already be closed.
      }

      Alert.alert(t.connectFailed, getErrorMessage(error));
      setScanMessage(t.connectFailedStatus);
    } finally {
      setIsConnecting(false);
    }
  };

  const readCharacteristic = async (prediction: boolean) => {
    if (!connectedDevice) return;
    setIsWorking(true);

    try {
      const characteristic = await manager.readCharacteristicForDevice(
        connectedDevice.id,
        SERVICE_UUID,
        CHAR_UUID,
      );
      const rawData = Buffer.from(
        characteristic.value ?? '',
        'base64',
      ).toString('utf-8');

      setReceivedData(rawData || t.emptyValue);
      if (prediction) {
        setHasPrediction(true);
      } else {
        setHasInitialReading(true);
      }
    } catch (error) {
      Alert.alert(t.readFailed, getErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  const writeCharacteristic = async () => {
    if (!connectedDevice) return;

    const valueToWrite = writeValue.trim();
    if (!valueToWrite) {
      Alert.alert(t.missingNamesTitle, t.missingNamesBody);
      return;
    }

    setIsWorking(true);
    try {
      const base64Value = Buffer.from(valueToWrite, 'utf-8').toString('base64');
      await manager.writeCharacteristicWithResponseForDevice(
        connectedDevice.id,
        SERVICE_UUID,
        CHAR_UUID,
        base64Value,
      );
      setHasWritten(true);
      setHasPrediction(false);
      setReceivedData(t.namesReceived);
      Alert.alert(t.writeSuccessTitle, t.writeSuccessBody);
    } catch (error) {
      Alert.alert(t.writeFailed, getErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  const disconnectDevice = async () => {
    if (!connectedDevice) return;

    try {
      await manager.cancelDeviceConnection(connectedDevice.id);
    } finally {
      setConnectedDevice(null);
      setConnectedToTarget(false);
      resetCeremony();
      setScanMessage(t.disconnectedStatus);
    }
  };

  const renderDevice = ({ item }: { item: Device }) => {
    const cannotConnect = item.isConnectable === false;
    const isTarget = isTargetDevice(item);
    return (
      <Pressable
        disabled={cannotConnect}
        onPress={() => connectToDevice(item)}
        style={({ pressed }) => [
          styles.deviceCard,
          isTarget && styles.targetDeviceCard,
          cannotConnect && styles.deviceCardDisabled,
          pressed && !cannotConnect && styles.deviceCardPressed,
        ]}>
        <View style={styles.deviceIconCircle}>
          <Text style={styles.deviceIcon}>✦</Text>
        </View>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceNameRow}>
            <Text style={styles.deviceName}>{getDeviceName(item, language)}</Text>
            {isTarget && (
              <View style={styles.targetBadge}>
                <Text style={styles.targetBadgeText}>{t.targetBadge}</Text>
              </View>
            )}
          </View>
          <Text selectable style={styles.deviceId} numberOfLines={1}>
            {item.id}
          </Text>
          <Text style={styles.deviceSignal}>
            {t.signal(item.rssi)}
            {cannotConnect ? `  •  ${t.cannotConnect}` : ''}
          </Text>
        </View>
        {!cannotConnect && <Text style={styles.deviceArrow}>›</Text>}
      </Pressable>
    );
  };

  if (connectedDevice) {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar style="light" />
        <MagicBackground />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.ceremonyContent,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 32,
            },
          ]}>
          <View style={styles.languageRow}>
            <LanguageToggle language={language} onChange={changeLanguage} />
          </View>
          <View accessibilityLiveRegion="polite" style={styles.connectedBadge}>
            <View style={styles.connectedDot} />
            <Text style={styles.connectedBadgeText}>
              {connectedToTarget ? t.connectedVerified : t.connectedGeneral}
            </Text>
          </View>

          <Text style={styles.eyebrow}>THE GRADE ORACLE</Text>
          <Text style={styles.ceremonyTitle}>
            {connectedToTarget ? t.ceremonyTitle : t.generalConnectionTitle}
          </Text>
          <Text style={styles.hatMedium}>🎩</Text>
          <Text style={styles.connectedName}>
            {connectedToTarget
              ? t.connectedQuote(getDeviceName(connectedDevice, language))
              : t.generalConnectedQuote(getDeviceName(connectedDevice, language))}
          </Text>

          {connectedToTarget ? (
            <>
              <View style={styles.parchmentCard}>
                <Text style={styles.parchmentLabel}>
                  {hasPrediction ? t.predictionLabel : t.characteristicLabel}
                </Text>
                <View style={styles.ornamentRow}>
                  <View style={styles.ornamentLine} />
                  <Text style={styles.ornament}>✦</Text>
                  <View style={styles.ornamentLine} />
                </View>
                <Text
                  selectable
                  style={[
                    styles.predictionText,
                    hasPrediction && styles.predictionTextFinal,
                  ]}>
                  {receivedData || t.hiddenPrediction}
                </Text>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepHeading}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepHeadingText}>
                    <Text style={styles.stepTitle}>{t.step1Title}</Text>
                    <Text style={styles.stepDescription}>{t.step1Description}</Text>
                  </View>
                  {hasInitialReading && <Text style={styles.completeMark}>✓</Text>}
                </View>
                <MagicButton
                  disabled={isWorking || hasInitialReading}
                  onPress={() => readCharacteristic(false)}>
                  {hasInitialReading ? t.readDone : t.readFirst}
                </MagicButton>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepHeading}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepHeadingText}>
                    <Text style={styles.stepTitle}>{t.step2Title}</Text>
                    <Text style={styles.stepDescription}>{t.step2Description}</Text>
                  </View>
                  {hasWritten && <Text style={styles.completeMark}>✓</Text>}
                </View>
                <TextInput
                  style={styles.magicInput}
                  value={writeValue}
                  onChangeText={setWriteValue}
                  editable={!isWorking}
                  placeholder={t.namesPlaceholder}
                  placeholderTextColor="#8B8068"
                  autoCapitalize="words"
                  returnKeyType="done"
                />
                <MagicButton
                  disabled={isWorking || !hasInitialReading || !writeValue.trim()}
                  onPress={writeCharacteristic}>
                  {t.sendNames}
                </MagicButton>
                {!hasInitialReading && (
                  <Text style={styles.lockHint}>{t.step1Hint}</Text>
                )}
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepHeading}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepHeadingText}>
                    <Text style={styles.stepTitle}>{t.step3Title}</Text>
                    <Text style={styles.stepDescription}>{t.step3Description}</Text>
                  </View>
                  {hasPrediction && <Text style={styles.completeMark}>✓</Text>}
                </View>
                <MagicButton
                  disabled={isWorking || !hasWritten}
                  onPress={() => readCharacteristic(true)}>
                  {isWorking ? t.thinking : t.revealPrediction}
                </MagicButton>
                {!hasWritten && (
                  <Text style={styles.lockHint}>{t.step2Hint}</Text>
                )}
              </View>
            </>
          ) : (
            <View style={styles.generalDeviceCard}>
              <Text style={styles.generalDeviceIcon}>⌁</Text>
              <Text style={styles.generalDeviceTitle}>{t.generalDeviceTitle}</Text>
              <Text style={styles.generalDeviceDescription}>
                {t.generalDeviceDescription}
              </Text>
              <Text selectable style={styles.generalDeviceId}>
                {connectedDevice.id}
              </Text>
              <Text style={styles.generalDeviceHint}>{t.generalDeviceHint}</Text>
            </View>
          )}

          <MagicButton secondary onPress={disconnectDevice}>
            {t.disconnect}
          </MagicButton>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <MagicBackground />
      <FlatList
        data={filteredDevices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.deviceList,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.hero}>
            <View style={styles.languageRow}>
              <LanguageToggle language={language} onChange={changeLanguage} />
            </View>
            <Text style={styles.eyebrow}>THE GRADE ORACLE</Text>
            <View style={styles.hatSeal}>
              <Text style={styles.hatHero}>🎩</Text>
            </View>
            <Text style={styles.heroTitle}>{t.heroTitle}</Text>
            <Text style={styles.heroQuote}>{t.heroQuote}</Text>

            <View style={styles.statusCard}>
              <View style={styles.statusIcon}>
                <Text style={styles.statusIconText}>⌁</Text>
              </View>
              <View style={styles.statusCopy}>
                <Text style={styles.statusLabel}>{t.connectionStatus}</Text>
                <Text style={styles.statusText}>{scanMessage}</Text>
              </View>
            </View>

            <View style={styles.targetLockCard}>
              <Text style={styles.targetLockIcon}>⌾</Text>
              <View style={styles.targetLockCopy}>
                <Text style={styles.targetLockTitle}>{t.targetTitle}</Text>
                <Text selectable style={styles.targetUuid} numberOfLines={1}>
                  {SERVICE_UUID}
                </Text>
                <Text style={styles.targetLockDescription}>{t.targetDescription}</Text>
              </View>
            </View>

            <MagicButton onPress={startScan}>{t.startScan}</MagicButton>

            {devices.length > 0 && (
              <>
                <View style={styles.filterCard}>
                  <Text style={styles.filterTitle}>{t.filterTitle}</Text>
                  <View style={styles.filterOptions}>
                    {(['target', 'all'] as const).map((option) => {
                      const selected = deviceFilter === option;
                      const count =
                        option === 'target' ? targetDeviceCount : devices.length;

                      return (
                        <Pressable
                          key={option}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => setDeviceFilter(option)}
                          style={[
                            styles.filterOption,
                            selected && styles.filterOptionSelected,
                          ]}>
                          <Text
                            style={[
                              styles.filterOptionText,
                              selected && styles.filterOptionTextSelected,
                            ]}>
                            {option === 'target' ? t.targetFilter : t.allFilter}
                          </Text>
                          <View
                            style={[
                              styles.filterCount,
                              selected && styles.filterCountSelected,
                            ]}>
                            <Text
                              style={[
                                styles.filterCountText,
                                selected && styles.filterCountTextSelected,
                              ]}>
                              {count}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t.searchPlaceholder}
                    placeholderTextColor="#7F859E"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    style={styles.deviceSearchInput}
                  />
                </View>

                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>{t.matchedDevices}</Text>
                  <Text style={styles.resultSummary}>
                    {t.resultCount(filteredDevices.length, devices.length)}
                  </Text>
                </View>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✧</Text>
            <Text style={styles.emptyTitle}>
              {devices.length === 0
                ? t.emptyTitle
                : normalizedSearchQuery
                  ? t.searchNotFoundTitle
                  : t.targetNotFoundTitle}
            </Text>
            <Text style={styles.emptyDescription}>
              {devices.length === 0
                ? t.emptyDescription
                : normalizedSearchQuery
                  ? t.searchNotFoundDescription
                  : t.targetNotFoundDescription(devices.length)}
            </Text>
          </View>
        }
      />

      <WaitingOverlay
        visible={isScanning}
        mode="scan"
        foundCount={devices.length}
        language={language}
        onCancel={() => stopScan(t.scanCancelled)}
      />
      <WaitingOverlay
        visible={isConnecting}
        mode="connect"
        foundCount={devices.length}
        deviceName={connectingName}
        language={language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.midnight,
  },
  star: {
    position: 'absolute',
    color: colors.goldBright,
  },
  languageRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  languageToggle: {
    flexDirection: 'row',
    padding: 3,
    borderWidth: 1,
    borderColor: '#4A506B',
    borderRadius: 18,
    backgroundColor: colors.navy,
  },
  languageOption: {
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  languageOptionSelected: {
    backgroundColor: colors.gold,
  },
  languageOptionText: {
    color: '#A9AEC4',
    fontSize: 12,
    fontWeight: '800',
  },
  languageOptionTextSelected: {
    color: colors.ink,
  },
  deviceList: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 12,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
    paddingBottom: 12,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  hatSeal: {
    width: 118,
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 59,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.navyLight,
    boxShadow: '0 0 28px rgba(215, 175, 82, 0.25)',
  },
  hatHero: {
    fontSize: 66,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 31,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroQuote: {
    maxWidth: 330,
    color: colors.parchmentMuted,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  statusCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#343A59',
    borderRadius: 14,
    backgroundColor: colors.navy,
    borderCurve: 'continuous',
  },
  statusIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#272D4B',
  },
  statusIconText: {
    color: colors.goldBright,
    fontSize: 28,
  },
  statusCopy: {
    flex: 1,
    gap: 3,
  },
  statusLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  statusText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
  },
  targetLockCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#66572F',
    borderRadius: 14,
    backgroundColor: 'rgba(94, 76, 35, 0.18)',
    borderCurve: 'continuous',
  },
  targetLockIcon: {
    color: colors.goldBright,
    fontSize: 26,
  },
  targetLockCopy: {
    flex: 1,
    gap: 2,
  },
  targetLockTitle: {
    color: colors.goldBright,
    fontSize: 13,
    fontWeight: '800',
  },
  targetUuid: {
    color: colors.parchmentMuted,
    fontSize: 10,
  },
  targetLockDescription: {
    color: '#9EA4BE',
    fontSize: 11,
    lineHeight: 16,
  },
  magicButton: {
    width: '100%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.goldBright,
    borderRadius: 12,
    backgroundColor: colors.burgundy,
    boxShadow: '0 5px 16px rgba(0, 0, 0, 0.3)',
    borderCurve: 'continuous',
  },
  magicButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#777B8D',
    boxShadow: 'none',
  },
  magicButtonDisabled: {
    opacity: 0.42,
  },
  magicButtonPressed: {
    backgroundColor: colors.burgundyLight,
    transform: [{ scale: 0.985 }],
  },
  magicButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  magicButtonSecondaryText: {
    color: colors.parchmentMuted,
  },
  filterCard: {
    width: '100%',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#343A59',
    borderRadius: 14,
    backgroundColor: colors.navy,
    borderCurve: 'continuous',
  },
  filterTitle: {
    color: colors.parchment,
    fontSize: 14,
    fontWeight: '800',
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#4A506B',
    borderRadius: 12,
    backgroundColor: colors.navyLight,
    borderCurve: 'continuous',
  },
  filterOptionSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(94, 76, 35, 0.42)',
  },
  filterOptionText: {
    color: '#A9AEC4',
    fontSize: 13,
    fontWeight: '800',
  },
  filterOptionTextSelected: {
    color: colors.goldBright,
  },
  filterCount: {
    minWidth: 23,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#2A304D',
  },
  filterCountSelected: {
    backgroundColor: colors.gold,
  },
  filterCountText: {
    color: '#B9BED1',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  filterCountTextSelected: {
    color: colors.ink,
  },
  deviceSearchInput: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#4A506B',
    borderRadius: 11,
    backgroundColor: '#0D1020',
    color: colors.white,
    fontSize: 14,
    borderCurve: 'continuous',
  },
  sectionHeading: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  sectionTitle: {
    color: colors.parchment,
    fontSize: 17,
    fontWeight: '700',
  },
  resultSummary: {
    color: colors.parchmentMuted,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  resultPill: {
    minWidth: 30,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
    borderRadius: 15,
    backgroundColor: colors.gold,
    color: colors.ink,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#3A405E',
    borderRadius: 14,
    backgroundColor: colors.navy,
    borderCurve: 'continuous',
  },
  targetDeviceCard: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(71, 56, 25, 0.72)',
  },
  deviceCardDisabled: {
    opacity: 0.46,
  },
  deviceCardPressed: {
    backgroundColor: colors.navyLight,
    borderColor: colors.gold,
  },
  deviceIconCircle: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#2A2440',
  },
  deviceIcon: {
    color: colors.goldBright,
    fontSize: 20,
  },
  deviceInfo: {
    flex: 1,
    gap: 3,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  deviceName: {
    flexShrink: 1,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.gold,
  },
  targetBadgeText: {
    color: colors.ink,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  deviceId: {
    color: '#9EA4BE',
    fontSize: 11,
  },
  deviceSignal: {
    color: colors.parchmentMuted,
    fontSize: 12,
  },
  deviceArrow: {
    color: colors.gold,
    fontSize: 30,
    fontWeight: '300',
  },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3A405E',
    borderRadius: 14,
    backgroundColor: 'rgba(17, 21, 42, 0.72)',
    borderCurve: 'continuous',
  },
  emptyIcon: {
    color: colors.gold,
    fontSize: 30,
  },
  emptyTitle: {
    color: colors.parchment,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#9EA4BE',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(4, 5, 13, 0.96)',
  },
  overlayCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 26,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 24,
    backgroundColor: colors.navy,
    boxShadow: '0 0 36px rgba(215, 175, 82, 0.18)',
    borderCurve: 'continuous',
  },
  overlaySparkle: {
    color: colors.gold,
    fontSize: 15,
    letterSpacing: 3,
  },
  hatLarge: {
    fontSize: 82,
  },
  overlayTitle: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  overlayDescription: {
    color: colors.parchmentMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  foundPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#262C49',
  },
  foundPillText: {
    color: colors.goldBright,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#B9BED1',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  ceremonyContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  connectedBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#5AA783',
    borderRadius: 18,
    backgroundColor: 'rgba(62, 138, 104, 0.18)',
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#74D6A7',
  },
  connectedBadgeText: {
    color: '#A9E5C7',
    fontSize: 13,
    fontWeight: '800',
  },
  generalDeviceCard: {
    alignItems: 'center',
    gap: 12,
    padding: 22,
    borderWidth: 1,
    borderColor: '#4A506B',
    borderRadius: 16,
    backgroundColor: colors.navy,
    borderCurve: 'continuous',
  },
  generalDeviceIcon: {
    color: colors.goldBright,
    fontSize: 38,
  },
  generalDeviceTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  generalDeviceDescription: {
    color: colors.parchmentMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  generalDeviceId: {
    color: '#9EA4BE',
    fontSize: 11,
    textAlign: 'center',
  },
  generalDeviceHint: {
    color: '#9EA4BE',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  ceremonyTitle: {
    color: colors.white,
    fontSize: 29,
    fontWeight: '800',
    textAlign: 'center',
  },
  hatMedium: {
    fontSize: 62,
    textAlign: 'center',
  },
  connectedName: {
    color: colors.parchmentMuted,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  parchmentCard: {
    gap: 10,
    padding: 22,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: 16,
    backgroundColor: colors.parchment,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.32)',
    borderCurve: 'continuous',
  },
  parchmentLabel: {
    color: '#735F2D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#B99A50',
  },
  ornament: {
    color: '#8A6A26',
  },
  predictionText: {
    minHeight: 46,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
  },
  predictionTextFinal: {
    color: colors.burgundy,
    fontSize: 25,
    fontWeight: '900',
  },
  stepCard: {
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#363D5B',
    borderRadius: 16,
    backgroundColor: colors.navy,
    borderCurve: 'continuous',
  },
  stepHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 18,
    backgroundColor: '#29233D',
  },
  stepNumberText: {
    color: colors.goldBright,
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  stepHeadingText: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  stepDescription: {
    color: '#9EA4BE',
    fontSize: 12,
  },
  completeMark: {
    color: '#75D5A7',
    fontSize: 24,
    fontWeight: '900',
  },
  magicInput: {
    minHeight: 50,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#A58B4B',
    borderRadius: 10,
    backgroundColor: colors.parchment,
    color: colors.ink,
    fontSize: 16,
    borderCurve: 'continuous',
  },
  lockHint: {
    color: '#8E94AD',
    fontSize: 12,
    textAlign: 'center',
  },
});
