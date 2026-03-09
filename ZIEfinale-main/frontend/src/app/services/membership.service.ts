import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IAnnualFeeStatus {
  isRenewalDue: boolean;
  daysUntilDue: number;
  daysOverdue: number;
  nextDueDate: string | Date;
  amountUSD: number;
  amountZWG: number;
  exchangeRate: number;
  grade: string;
  gradeName: string;
  message: string;
}

export interface IAnnualFeeResponse {
  hasMembership: boolean;
  message?: string;
  feeStatus?: IAnnualFeeStatus;
  exchangeRate?: number;
  userInfo?: any;
}

export interface IAnnualFeeAmount {
  grade: string;
  gradeName: string;
  amountUSD: number;
  amountZWG: number;
  exchangeRate: number;
  renewalFrequencyDays: number;
}

export interface IAnnualFeesData {
  fees: IAnnualFeeAmount[];
  exchangeRate: number;
  roundedExchangeRate: string;
  renewalCycleDays: number;
  remindersStartAfterDays: number;
}

export interface IExchangeRateResponse {
  exchangeRate: number;
  display: string;
  source: string;
  isManual?: boolean;
  lastUpdated: string;
}

export interface IExchangeRateInfo extends IExchangeRateResponse {
  cachedRate?: number;
}

export interface ISetExchangeRateRequest {
  rate: number;
}

export interface ISetExchangeRateResponse {
  message: string;
  exchangeRate: number;
  display: string;
  isManual: boolean;
  lastUpdated: string;
  updatedBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private apiUrl = 'http://localhost:5000/api/membership';

  constructor(private http: HttpClient) {}

  /**
   * Get the current annual fee status for the logged-in member
   */
  getAnnualFeeStatus(): Observable<IAnnualFeeResponse> {
    return this.http.get<IAnnualFeeResponse>(`${this.apiUrl}/annual-fee-status`);
  }

  /**
   * Get the annual fee amount for a specific membership grade
   */
  getFeeAmount(grade: string): Observable<IAnnualFeeAmount> {
    return this.http.get<IAnnualFeeAmount>(`${this.apiUrl}/fee-amount/${grade}`);
  }

  /**
   * Get all annual fee amounts for all membership grades
   */
  getAllFees(): Observable<IAnnualFeesData> {
    return this.http.get<IAnnualFeesData>(`${this.apiUrl}/all-fees`);
  }

  /**
   * Get the current USD to ZWG exchange rate
   */
  getExchangeRate(): Observable<IExchangeRateResponse> {
    return this.http.get<IExchangeRateResponse>(`${this.apiUrl}/exchange-rate`);
  }

  /**
   * Admin endpoint: Get detailed exchange rate information
   */
  getExchangeRateInfo(): Observable<IExchangeRateInfo> {
    return this.http.get<IExchangeRateInfo>(`${this.apiUrl}/admin/exchange-rate-info`);
  }

  /**
   * Admin endpoint: Manually set the exchange rate
   */
  setExchangeRate(rate: number): Observable<ISetExchangeRateResponse> {
    return this.http.post<ISetExchangeRateResponse>(`${this.apiUrl}/admin/set-exchange-rate`, { rate });
  }
}
