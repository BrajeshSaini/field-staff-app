import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone:false,
})
export class UsersPage implements OnInit {

  users = [

    {
      name:'Rahul Sharma',
      designation:'Software Developer',
      department:'IT',
      mobile:'9876543210',
      email:'rahul@gmail.com',
      status:'Active',
      image:'https://i.pravatar.cc/150?img=1'
    },

    {
      name:'Priya Singh',
      designation:'HR Manager',
      department:'Human Resource',
      mobile:'9898989898',
      email:'priya@gmail.com',
      status:'Active',
      image:'https://i.pravatar.cc/150?img=5'
    },

    {
      name:'Amit Patel',
      designation:'Accountant',
      department:'Accounts',
      mobile:'9874512365',
      email:'amit@gmail.com',
      status:'Inactive',
      image:'https://i.pravatar.cc/150?img=8'
    }

  ];
  
  constructor() { }

  ngOnInit() {
  }

}
