import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BossKillResponse } from '../models/boss-kill.model';

@Injectable({
  providedIn: 'root'
})
export class BossKillService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getBossKills(): Observable<BossKillResponse> {
    return this.http.get<BossKillResponse>(`${this.apiUrl}/boss-kills`);
  }
}
