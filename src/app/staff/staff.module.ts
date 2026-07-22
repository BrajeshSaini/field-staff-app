import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StaffPageRoutingModule } from './staff-routing.module';

import { StaffPage } from './staff.page';
import { SharedModule } from '../share/shared/shared-module';
import { HrmActionComponent } from './hrm-action/hrm-action.component';
import { SelfieComponent } from './selfie/selfie.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StaffPageRoutingModule,
    SharedModule
  ],
  declarations: [StaffPage, HrmActionComponent, SelfieComponent]
})
export class StaffPageModule {}
