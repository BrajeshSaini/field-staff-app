import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';

const ATTENDANCE_STORAGE_PREFIX = 'attendance_records_';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {

  // Every attendance record from every employee, pulled from localStorage
  attendance_records: any[] = [];

  employees = [

    {
      name: 'Rahul Sharma',
      checkIn: '09:05 AM',
      checkOut: '06:15 PM',
      duration: '9h 10m',
      location: 'Bhopal Office'
    },

    {
      name: 'Priya Singh',
      checkIn: '09:20 AM',
      checkOut: '06:30 PM',
      duration: '9h 10m',
      location: 'Indore Office'
    },

    {
      name: 'Amit Patel',
      checkIn: '08:55 AM',
      checkOut: '06:05 PM',
      duration: '9h 10m',
      location: 'Remote'
    }

  ];

  constructor(private router: Router) { }

  ngOnInit() {
    this.load_all_attendance_records();
  }

  /**
   * Scans localStorage for every key that holds an employee's attendance array
   * (attendance_records_<user_id>) and merges them into one flat list for the
   * admin table. Each record keeps its own user_id since there's no name
   * lookup available here — attach one if you have an employee list to join against.
   */
  load_all_attendance_records(): void {
    let all_records: any[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(ATTENDANCE_STORAGE_PREFIX)) {
        continue;
      }

      try {
        const records = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(records)) {
          all_records = all_records.concat(records);
        }
      } catch (e) {
        console.error(`Failed to parse attendance records for key "${key}"`, e);
      }
    }

    // Most recent first
    all_records.sort((a, b) => (b.date + b.in_time).localeCompare(a.date + a.in_time));

    this.attendance_records = all_records;
  }

  // logout() {

  //   // Clear local storage
  //   localStorage.clear();

  //   // Navigate to login page
  //   // this.router.navigate(['/login']);

  //   console.log('Logout');

  // }


  logout() {

    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');

    this.router.navigateByUrl('/login');

  }
}