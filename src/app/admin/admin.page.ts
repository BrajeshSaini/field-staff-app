
import { Component, AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { Router } from '@angular/router';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false
})
export class AdminPage implements AfterViewInit {

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


  ngAfterViewInit() {

    new Chart('attendanceChart', {

      type: 'pie',

      data: {

        labels: ['Present', 'Absent', 'Leave'],

        datasets: [{
          data: [60, 20, 20]
        }]

      }

    });

  }

  logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('logged_user_details');
    this.router.navigateByUrl('/login');
  }
}