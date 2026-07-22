import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent {



  loginData = {
    email: '',
    password: ''
  };

  hidePassword = true;

  constructor(private router: Router) {

    let isLoggedIn: any = JSON.parse(JSON.parse(JSON.stringify(localStorage.getItem("isLoggedIn"))))
    console.log(isLoggedIn);


    if (!isLoggedIn) {
      this.router.navigateByUrl('/login');
    }
  }


  ionViewDidEnter() {
    let isLoggedIn: any = JSON.parse(JSON.parse(JSON.stringify(localStorage.getItem("isLoggedIn"))))
    console.log(isLoggedIn);


    if (!isLoggedIn) {
      this.router.navigateByUrl('/');
    }

  }

  // login() {
  //   console.log(this.loginData);
  //   this.router.navigateByUrl('/admin')

  // }

  login() {
    // email id -> admin@gmail.com
    // password -> admin123

    // email id -> staff@gmail.com
    // password -> staff123
    // Admin Login
    if (
      this.loginData.email === 'admin@gmail.com' &&
      this.loginData.password === 'admin123'
    ) {

      localStorage.setItem('isLoggedIn', 'true');
      let logged_user_details = {
        name: 'Ravi',
        designation: 'Admin',
        department: 'CEO',
        mobile: '9876543210',
        email: 'admin@gmail.com',
        status: 'Active',
        image: 'https://i.pravatar.cc/150?img=3'
      };

      localStorage.setItem('logged_user_details', JSON.stringify(logged_user_details));
      localStorage.setItem('role', 'admin');

      this.router.navigateByUrl('/admin');
      return;
    }

    // Staff Login
    if (
      this.loginData.email === 'staff@gmail.com' &&
      this.loginData.password === 'staff123'
    ) {


      const staffUser = {
        id: 1,
        first_name: 'Rahul',
        last_name: 'Sharma',
        full_name: 'Rahul Sharma',
        email: 'staff@gmail.com',
        mobile: '9876543210',
        employee_id: 'EMP001',
        designation: 'Software Developer',
        department: 'IT',
        role: 'staff',
        company_id: 1,
        branch_id: 1,
        profile_image: 'assets/images/default-user.png',
        joining_date: '2025-01-15',
        status: 'Active'
      };

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('role', 'staff');
      localStorage.setItem('logged_user_details', JSON.stringify(staffUser));

      this.router.navigateByUrl('/staff');

      // localStorage.setItem('isLoggedIn', 'true');
      // localStorage.setItem('role', 'staff');

      // this.router.navigateByUrl('/staff');
      return;
    }

    alert('Invalid Email or Password');

  }

}
