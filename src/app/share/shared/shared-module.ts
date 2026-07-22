import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AttendanceRecodesComponent } from 'src/app/common/attendance-recodes/attendance-recodes.component';



@NgModule({
  declarations: [AttendanceRecodesComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  exports:[
    CommonModule,
    FormsModule,
    IonicModule,
    AttendanceRecodesComponent
  ]
})
export class SharedModule { }
