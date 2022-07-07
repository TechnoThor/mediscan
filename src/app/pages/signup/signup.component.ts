import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/models/User';
import { UserService } from '../../shared/services/user.service';
import {Router} from "@angular/router";

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  signUpForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
    rePassword: new FormControl(''),
    name: new FormGroup({
      firstname: new FormControl(''),
      lastname: new FormControl('')
    })
  });

  loading = false;
  error: any;

  constructor(private router: Router, private location: Location, private authService: AuthService, private userService: UserService) { }

  ngOnInit(): void {
  }

  onSubmit() {
    this.loading = true;
    console.log(this.signUpForm.value);
    this.authService.signup(this.signUpForm.get('email')?.value, this.signUpForm.get('password')?.value).then(cred => {
      console.log(cred);
      const user: User = {
        id: cred.user?.uid as string,
        email: this.signUpForm.get('email')?.value,
      };
      this.userService.create(user).then(_ => {
        console.log('User added successfully.');
        this.router.navigateByUrl('/main');
        this.loading = false;
        this.setError(false);
      }).catch(error => {
        console.error(error);
        this.loading = false;
        this.setError(true);
      });
    }).catch(error => {
      console.error(error);
      this.loading = false;
      this.setError(true);
    });
  }

  setError(isError: boolean): void {
    if(isError) {
      this.error = 'Nem megfelelő adatok!';
    } else {
      this.error = null;
    }
  }

  goToPage(pageName: string){
    this.router.navigate([`${pageName}`]);
  }

}
