import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {AngularFireStorage} from "@angular/fire/compat/storage";
import {Observable} from "rxjs";
import {Booking} from "../models/Booking";

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  // HTTP

  collectionName = 'Bookings';

  constructor(
    private http: HttpClient,
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) { }

  create(booking: Booking, user_id: string) {
    booking.user_id=user_id;
    booking.id = this.afs.createId();
    console.log(booking);
    return this.afs.collection<Booking>(this.collectionName).doc(booking.id).set(booking);
  }

  getAll() {
    return this.afs.collection<Booking>(this.collectionName).valueChanges();
  }

  update(booking: Booking) {
    return this.afs.collection<Booking>(this.collectionName).doc(booking.id).set(booking);
  }

  delete(id: string) {
    return this.afs.collection<Booking>(this.collectionName).doc(id).delete();
  }

  getBookingsByUserId(employeeId: string) {
    return this.afs.collection<Booking>(this.collectionName, ref => ref.where('user_id', '==', employeeId).orderBy('date', 'asc')).valueChanges();
  }
}
