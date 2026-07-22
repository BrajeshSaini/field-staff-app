import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminPage } from './admin.page';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
 {
    path: '',
    component: AdminPage,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
        // loadChildren: () =>
        //   import('../dashboard/dashboard.module').then(m => m.DashboardPageModule),
      },
      {
        path: 'users',
        loadChildren: () =>
          import("./users/users.module").then(m=>m.UsersPageModule)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminPageRoutingModule {}
