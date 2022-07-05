import {IonicModule} from '@ionic/angular';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ScannerRoutingModule} from './scanner-routing.module';
import {ScannerComponent} from './scanner.component';
import {MatButtonModule} from '@angular/material/button';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ScannerRoutingModule,
    MatButtonModule,
  ],
  declarations: [ScannerComponent]
})
export class ScannerModule {
}
