import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { FakeLoadingService } from '../../shared/services/fake-loading.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  email = new UntypedFormControl('');
  password = new UntypedFormControl('');

  loadingSubscription?: Subscription;
  loadingObservation?: Observable<boolean>;

  loading: boolean = false;
  error: any;

  constructor(private router: Router, private loadingService: FakeLoadingService, private authService: AuthService) { }

  ngOnInit(): void {
    this.setError(false);
  }

  async login() {
    this.loading = true;

      this.authService.login(this.email.value, this.password.value).then(cred => {
        this.router.navigateByUrl('/main');
        this.loading = false;
        this.setError(false);
      }).catch(error => {
        console.error(error);
        this.setError(true);
        this.loading = false;
      });
  }

  setError(isError: boolean): void {
    if(isError) {
      this.error = "Hibás email és jelszó páros!";
    } else {
      this.error = null;
    }
  }

  ngOnDestroy() {
    this.loadingSubscription?.unsubscribe();
  }

}
