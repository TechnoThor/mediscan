import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee } from '../models/Employee';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {

  // HTTP

  collectionName = 'Employee';

  constructor(
    private http: HttpClient,
    private afs: AngularFirestore,
    private storage: AngularFireStorage
    ) { }

  loadGalleryMeta(metaUrl: string): Observable<Array<Employee>> {
    return this.afs.collection<Employee>(this.collectionName).valueChanges();
  }

  loadImage(imageUrl: string) {
    return this.storage.ref(imageUrl).getDownloadURL();

  }
}
