import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.page.html',
  styleUrls: ['./staff.page.scss'],
  standalone: false
})
export class StaffPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }


}
