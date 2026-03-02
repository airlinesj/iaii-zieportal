import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RefereeAppraisal {
  question1: string;
  question2: string;
  question3: string;
  question4: string;
  question5: string;
  question6: string;
  question7: string;
  question8: string;
}

@Injectable({
  providedIn: 'root',
})
export class RefereeService {
  private apiUrl = `${environment.apiUrl}/referees`;

  constructor(private http: HttpClient) {}

  getRefereeAppraisal(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${token}`);
  }

  submitAppraisal(token: string, appraisal: RefereeAppraisal): Observable<any> {
    return this.http.post(`${this.apiUrl}/${token}/submit`, appraisal);
  }
}
