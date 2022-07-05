import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnChanges {

  @Input() employeeObjectInput?: Array<any>;
  @Output() employeeObjectEmitter: EventEmitter<any> = new EventEmitter();
  chosenEmployee: any;

  constructor() { }

  ngOnChanges() {
    if (this.employeeObjectInput) {
      this.chosenEmployee = this.employeeObjectInput[0];
      this.reload();
    }
  }

  ngOnInit(): void {

  }

  reload() {
    this.employeeObjectEmitter.emit(this.chosenEmployee);
  }

}
