// user.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from './auth.service';
import { map, Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private firestore: AngularFirestore, private auth: AuthService) {}

  getUserRole(): Observable<string> {
    return this.auth.getUserId().pipe(
      switchMap(uid => this.firestore.doc(`users/${uid}`).valueChanges()),
      map((user: any) => user?.role || 'user')
    );
  }

  setUserRole(uid: string, role: 'user' | 'admin'): Promise<void> {
    return this.firestore.doc(`users/${uid}`).set({ role }, { merge: true });
  }
}