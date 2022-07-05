import { Component, OnInit } from '@angular/core';
import { Employee } from '../../shared/models/Employee';
import { EmployeesService } from '../../shared/services/employees.service';

@Component({
  selector: 'app-gallery',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {

  employeeObject?: Array<Employee>;
  chosenEmployee?: Employee;

  constructor(private galleryService: EmployeesService) { }

  ngOnInit(): void {
    this.galleryService.loadGalleryMeta('__credits.json').subscribe((data: Array<Employee>) => {
      console.log(data);
      this.employeeObject = data;
    })
  }

  loadEmployee(employeeObject: Employee) {
    this.chosenEmployee = employeeObject;
  }

}
