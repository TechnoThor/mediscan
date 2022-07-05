import { Component, ViewChild, ElementRef } from '@angular/core';
import { Chart,
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
  Tooltip } from 'chart.js';
import {
  BleClient,
  dataViewToHexString,
  ScanResult,
} from '@capacitor-community/bluetooth-le';
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

export interface MeansurementResult {
  spo2: number,
  pulse: number,
  pi: number
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})

export class Tab1Page {
  
  bluetoothScanResults: ScanResult[] = [];
  meansurementResults: MeansurementResult = {
    spo2: null,
    pulse: null,
    pi: null
  };
  started = true;
  foundData = false;
  dps = []

  bluetoothIsScanning = false;
  bluetoothConnectedDevice?: ScanResult;
  services = []
  pulseChart = null;

  readonly ViatomServiceUUID =
    '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'.toUpperCase();
  
  readonly ViatomCharacteristicUUID =
    '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'.toUpperCase();

    createChart(arrayPulse = []) {
      if (!arrayPulse) {
        return;
      }
      var canvas: HTMLCanvasElement = document.getElementById("pulseChart") as HTMLCanvasElement;
      var ctx = canvas.getContext("2d");
      this.pulseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: (this.getLabels(arrayPulse)),
            datasets: [{
                data: arrayPulse,
                borderWidth: 1,
                borderColor: "#FFAF00"
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

    updateChart(arrayPulse){
      if(arrayPulse.length > 7) {
        arrayPulse.shift();
      }
      if(this.pulseChart !== null) {
        console.log("körte:"+this.getLabels(arrayPulse)+", array:"+arrayPulse);
        this.pulseChart.data.labels=this.getLabels(arrayPulse);
        this.pulseChart.data.datasets.data = arrayPulse;
        this.pulseChart.update();
        
      }else{
        console.log("alma"+this.getLabels(arrayPulse));
        this.createChart(arrayPulse);
      }
    }

    getLabels(array) : typeof array{
      var labels = [];
      for (let index = 0; index < array.length; index++) {
        labels.push(index);
      }
      
      return labels;
    }


    async scanForBluetoothDevices() {
 
      try {
        await BleClient.initialize();
  
        this.bluetoothScanResults = [];
        this.bluetoothIsScanning = true;
  
        await BleClient.requestLEScan(
          { services: [this.ViatomServiceUUID] },
          this.onBluetoothDeviceFound.bind(this)
        );
  
        const stopScanAfterMilliSeconds = 3500;
        setTimeout(async () => {
          await BleClient.stopLEScan();
          this.bluetoothIsScanning = false;
          console.log('stopped scanning');
        }, stopScanAfterMilliSeconds);
      } catch (error) {
        this.bluetoothIsScanning = false;
        console.error('scanForBluetoothDevices', error);
      }
    }

    async scanForBluetoothDeviceServiceses(scanResult: ScanResult) {
      try {
        await BleClient.initialize();

        const device = scanResult.device;
  
       const result = await BleClient.getServices(
        device.deviceId
       );
      

      } catch (error) {
        console.error('scanForBluetoothDeviceServices');
      }
    }


    async getDeviceNotify() {
      try {
        if(!this.bluetoothConnectedDevice){
          return;
        }
        this.started = false;
        await BleClient.initialize();
  
        const device = this.bluetoothConnectedDevice.device;
        const stopScanAfterMilliSeconds = 1;
       
        await BleClient.startNotifications(
          device.deviceId,
          this.ViatomServiceUUID,
          this.ViatomCharacteristicUUID,
          (value) => {
            this.started = true;
            this.parseData(value);
          });
        
  
        setTimeout(async () => {
          if( this.started && this.foundData) {
            await BleClient.stopNotifications(
              device.deviceId,
              this.ViatomServiceUUID,
              this.ViatomCharacteristicUUID);
              this.started = false;
              this.foundData = false;
          }
         
        }, stopScanAfterMilliSeconds);

        this.getDeviceNotify();
       
      } catch (error) {
        console.log('No get data', error);
      }
    }

    parseData(value: DataView) {
      var stream = value;
      var byteArray = new Uint8Array(value.buffer);
        if((byteArray.length) > 0){
          for (let index = 0; index < byteArray.length; index++) {
            if(byteArray[index] === 0x08 && byteArray[index+1] === 0x01 && byteArray[index+5] !== undefined) {
              this.meansurementResults.spo2 = byteArray[index + 2];
              this.meansurementResults.pulse = byteArray[index+3];
              this.meansurementResults.pi = byteArray[index+5]/10;
              this.dps.push(byteArray[index+3])
              this.foundData = true;
              this.updateChart(this.dps);
              break;
            }
          }  
        }
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
        alert(`connected to device ${deviceName}`);
      } catch (error) {
        console.error('connectToDevice', error);
      }
    }
  
    async disconnectFromBluetoothDevice(scanResult: ScanResult) {
      const device = scanResult.device;
      try {
        await BleClient.disconnect(scanResult.device.deviceId);
        const deviceName = device.name ?? device.deviceId;
        alert(`disconnected from device ${deviceName}`);
      } catch (error) {
        console.error('disconnectFromDevice', error);
      }
    }
  
    onBluetooDeviceDisconnected(disconnectedDeviceId: string) {
      alert(`Diconnected ${disconnectedDeviceId}`);
      this.meansurementResults = {
        spo2: null,
        pulse: null,
        pi: null
      };
      this.bluetoothConnectedDevice = undefined;
    }


}

  
