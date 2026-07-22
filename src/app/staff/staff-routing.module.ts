import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StaffPage } from './staff.page';
import { HrmActionComponent } from './hrm-action/hrm-action.component';

const routes: Routes = [
  {
    path: '',
    component: HrmActionComponent,
   
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StaffPageRoutingModule {}
