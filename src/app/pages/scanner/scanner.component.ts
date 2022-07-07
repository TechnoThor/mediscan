import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import {Router} from '@angular/router';

import {AlertController} from '@ionic/angular';
import {DataService} from '../../shared/services/data.service';
import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip
} from 'chart.js';
import {
  BleClient,
  dataViewToHexString,
  ScanResult,
} from '@capacitor-community/bluetooth-le';

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

export interface MeasurementResult {
  spo2: number;
  pulse: number;
  pi: number;
}

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent implements OnInit {
  bluetoothScanResults: ScanResult[] = [];
  endScan = true;
  measurementResult: MeasurementResult = {
    spo2: null,
    pulse: null,
    pi: null
  };

  averageMeasurementResult = this.measurementResult;

  started = false;
  foundData = false;
  dps = [];

  bluetoothIsScanning = false;
  bluetoothConnectedDevice?: ScanResult;
  services = [];
  pulseChart = null;

  readonly viatomServiceUUID =
    '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'.toUpperCase();

  readonly viatomCharacteristicUUID =
    '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'.toUpperCase();

  constructor(private router: Router, private dataService: DataService, private alertController: AlertController) {
  }

  calculateAverage(array = []) {
    if (!array.length) {
      return;
    }

    let sumSpo2 = 0;
    let sumPulse = 0;
    let sumPi = 0;

    array.forEach(object => {
      sumSpo2 += object.spo2;
      sumPulse += object.pulse;
      sumPi += object.pi;
    });

    this.averageMeasurementResult = {
      spo2: this.round(sumSpo2 / array.length, 1),
      pulse: this.round(sumPulse / array.length, 1),
      pi: this.round(sumPi / array.length, 1)
    };
  }

  round(value, precision) {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }

  addData() {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!this.averageMeasurementResult.spo2 || !user.email || this.dps.length < 7) {
      return;
    }

    const data = new Date().getTime();
    this.dataService.create({
      id: Math.random().toString().substr(2, 8).toString(),
      email: user.email,
      spo2: this.averageMeasurementResult.spo2,
      pi: this.averageMeasurementResult.pi,
      pulse: this.averageMeasurementResult.pulse,
      date: data
    }).then(_ => {
      this.presentAlert('Sikeres adatmentés!', `Sikeres adatmentés a felhőbe, később visszanézheti az archív eredmények között.`);
    }).catch(error => {
      console.error(error);
    });
  }

  createChart(result = {
    labels: [],
    values: []
  }) {

    const canvas: HTMLCanvasElement = document.getElementById('pulseChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    this.pulseChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: (result.labels),
        datasets: [{
          data: (result.values),
          borderWidth: 1,
          borderColor: '#FFAF00'
        }]
      },
      options: {
        scales: {
          y: {
            stacked: true,
            grace: 70
          }
        }
      }
    });
  }

  updateChart(arrayPulse) {
    if (!arrayPulse.length) {
      return;
    }

    const result = this.getValues(arrayPulse);
    if (this.pulseChart !== null) {
      this.pulseChart.data.labels = result.labels;
      this.pulseChart.data.datasets.forEach((dataset) => {
        dataset.data = result.values;
      });
      this.pulseChart.update();

    } else {
      this.createChart(result);
    }
  }

  getValues(array): typeof array {
    const valuesArray = [];
    const labelsArray = [];
    array.forEach((valueObject, index) => {
      valuesArray.push(valueObject.pulse);
      labelsArray.push(index);
    });

    const result = {
      labels: labelsArray,
      values: valuesArray,
    };

    console.log('ez egy tömb' + result.labels + ' values:' + result.values);

    return result;
  }


  async stopScanForBluetoothDevices() {
    try {
      await BleClient.stopLEScan();
      this.bluetoothIsScanning = false;
    } catch (error) {
      this.bluetoothIsScanning = false;
      console.error('StopScanning', error);
    }
  }

  async scanForBluetoothDevices() {

    try {
      await BleClient.initialize();

      this.bluetoothScanResults = [];
      this.bluetoothIsScanning = true;

      await BleClient.requestLEScan(
        {services: [this.viatomServiceUUID]},
        this.onBluetoothDeviceFound.bind(this)
      );

      const stopScanAfterMilliSeconds = 3500;
      setTimeout(async () => {
        await this.stopScanForBluetoothDevices();
      }, stopScanAfterMilliSeconds);
    } catch (error) {
      this.bluetoothIsScanning = false;
      console.error('scanForBluetoothDevices', error);
    }
  }

  async startMonitoring() {
    this.averageMeasurementResult = {
      spo2: null,
      pulse: null,
      pi: null
    };
    this.measurementResult = {
      spo2: null,
      pulse: null,
      pi: null
    };
    this.dps = [];
    this.startStopTimer();
    await this.getDeviceNotify();
    this.calculateAverage(this.dps);
    this.updateChart(this.dps);
    this.addData();
  }

  async getDeviceNotify() {
    if (this.endScan) {
      await BleClient.stopNotifications(
        this.bluetoothConnectedDevice.device?.deviceId,
        this.viatomServiceUUID,
        this.viatomCharacteristicUUID);
      return;
    }

    try {
      if (!this.bluetoothConnectedDevice) {
        return;
      }
      await BleClient.initialize();

      const stopScanAfterMilliSeconds = 10;

      await BleClient.startNotifications(
        this.bluetoothConnectedDevice.device?.deviceId,
        this.viatomServiceUUID,
        this.viatomCharacteristicUUID,
        (value) => {
          this.parseData(value);
        });

      setTimeout(async () => {
        if (this.started && this.foundData) {
          await BleClient.stopNotifications(
            this.bluetoothConnectedDevice.device?.deviceId,
            this.viatomServiceUUID,
            this.viatomCharacteristicUUID);
          this.foundData = false;
        }
      }, stopScanAfterMilliSeconds);

      await this.getDeviceNotify();

    } catch (error) {
      console.log('No get data', error);
    }
  }

  parseData(value: DataView) {
    const stream = value;
    const byteArray = new Uint8Array(value.buffer);
    if ((byteArray.length) > 0) {
      for (let index = 0; index < byteArray.length; index++) {
        if (byteArray[index] === 0x08 && byteArray[index + 1] === 0x01 && byteArray[index + 5] !== undefined) {
          this.measurementResult.spo2 = byteArray[index + 2];
          this.measurementResult.pulse = byteArray[index + 3];
          this.measurementResult.pi = byteArray[index + 5] / 10;
          this.dps.push({
            spo2: this.measurementResult.spo2,
            pulse: this.measurementResult.pulse,
            pi: this.measurementResult.pi,
          });
          this.foundData = true;
          this.updateChart(this.dps);
          break;
        }
      }
    }
  }

  startStopTimer() {
    this.endScan = false;
    this.started = true;
    setTimeout(async () => {
      this.endScan = true;
      this.started = false;
    }, 10000);
  }


  onBluetoothDeviceFound(result) {
    console.log('received new scan result', result);
    this.bluetoothScanResults.push(result);
  }

  async connectToBluetoothDevice(scanResult: ScanResult) {
    const device = scanResult.device;

    try {
      await BleClient.connect(
        device.deviceId,
        this.onBluetooDeviceDisconnected.bind(this)
      );

      this.bluetoothConnectedDevice = scanResult;

      const deviceName = device.name ?? device.deviceId;
      await this.presentAlert('Sikeresen párosítás!',
        `Sikeresen párosította az (${deviceName}) oxigénszintmérőt.`);
    } catch (error) {
      console.error('connectToDevice', error);
    }
  }

  async disconnectFromBluetoothDevice(scanResult: ScanResult) {
    const device = scanResult.device;
    try {
      await BleClient.disconnect(scanResult.device.deviceId);
      const deviceName = device.name ?? device.deviceId;
      this.bluetoothConnectedDevice = undefined;
      this.bluetoothScanResults = [];
    } catch (error) {
      this.bluetoothScanResults = [];
      this.bluetoothConnectedDevice = undefined;
      console.error('disconnectFromDevice', error);
    }
  }

  onBluetooDeviceDisconnected(disconnectedDeviceId: string) {
    this.presentAlert(
      'A kapcsolat megszakítva!',
      `A párosított (${disconnectedDeviceId}) oxigénszintmérő  lecsatlakoztatva!`
    );
    this.measurementResult = {
      spo2: null,
      pulse: null,
      pi: null
    };
    this.dps = null;
    this.bluetoothConnectedDevice = undefined;
    this.bluetoothScanResults = [];
  }

  ngOnInit(): void {
  }

  goToPage(pageName: string) {
    this.router.navigate([`${pageName}`]);
  }

  async presentAlert(text: string, subtext: string) {
    const alert = await this.alertController.create({
      header: 'Figyelem!',
      subHeader: text,
      message: subtext,
      buttons: ['OK']
    });

    await alert.present();
  }
}



