import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Employee} from '../../../shared/models/Employee';
import {Comment} from '../../../shared/models/Comment';
import {EmployeesService} from '../../../shared/services/employees.service';
import {CommentService} from '../../../shared/services/comment.service';
import {UserService} from '../../../shared/services/user.service';
import {User} from '../../../shared/models/User';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent implements OnInit, OnChanges {

  @Input() employeeInput?: Employee;
  loadedImage?: string;
  loadedEmployee?: Employee | null;
  user?: User;

  // commentObject: any = {};
  comments: Array<Comment> = [];

  commentsForm = this.createForm({
    id: '',
    username: '',
    comment: '',
    date: 0,
    imageId: this.employeeInput?.id
  });

  displayedColumns: string[] = ['actions', 'username', 'comment', 'date'];

  constructor(private fb: FormBuilder,
              private router: Router,
              private galleryService: EmployeesService,
              private commentService: CommentService,
              private userService: UserService
  ) {
  }

  ngOnChanges(): void {
    if (this.employeeInput?.id) {
      this.commentsForm.get('imageId')?.setValue(this.employeeInput.id);
      this.loadedEmployee = this.employeeInput;
      this.galleryService.loadImage(this.employeeInput.image_url).subscribe(data => {
        this.loadedImage = data;
      });
      this.commentService.getCommentsByImageId(this.employeeInput.id).subscribe(comments => {
        this.comments = comments;
      })
    }
  }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') as string) as firebase.default.User;
    this.userService.getById(user.uid).subscribe(data => {
      this.user = data;
      this.commentsForm.get('username')?.setValue(this.user?.username);
    }, error => {
      console.error(error);
    });

  }

  createForm(model: Comment) {
    let formGroup = this.fb.group(model);
    formGroup.get('username')?.addValidators([Validators.required]);
    formGroup.get('comment')?.addValidators([Validators.required, Validators.minLength(10)]);
    return formGroup;
  }

  addComment() {
    if (this.commentsForm.valid) {
      if (this.commentsForm.get('username') && this.commentsForm.get('comment')) {
        this.commentsForm.get('date')?.setValue(new Date().getTime());
        this.commentService.create(this.commentsForm.value).then(_ => {
          alert("Sikeres kommentelés");
        }).catch(error => {
          console.error(error);
        });
      }
    }
  }

  deleteComment(commentId: string) {
    this.commentService.delete(commentId).then(_ => {
      alert("Sikeres törlés");
    }).catch(error => {
      console.error(error);
    });
  }

}
