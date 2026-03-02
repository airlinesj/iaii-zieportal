import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface FormState {
  [formName: string]: {
    [fieldName: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FormPersistenceService {
  private readonly STORAGE_KEY = 'ZIE_FORM_DATA';
  private formState = new BehaviorSubject<FormState>({});

  constructor() {
    this.loadFormData();
  }

  /**
   * Save form data to localStorage (called on form changes)
   * @param formName Name of the form (e.g., 'expatriate-form', 'm1-form')
   * @param fieldName Field identifier
   * @param value Field value
   */
  saveFieldData(formName: string, fieldName: string, value: any): void {
    const currentState = this.formState.value;
    if (!currentState[formName]) {
      currentState[formName] = {};
    }
    currentState[formName][fieldName] = value;
    this.formState.next({ ...currentState });
    this.persistToStorage();
  }

  /**
   * Save entire form data at once
   * @param formName Name of the form
   * @param data Form data object
   */
  saveFormData(formName: string, data: Record<string, any>): void {
    const currentState = this.formState.value;
    currentState[formName] = data;
    this.formState.next({ ...currentState });
    this.persistToStorage();
  }

  /**
   * Get data for a specific field
   * @param formName Name of the form
   * @param fieldName Field identifier
   */
  getFieldData(formName: string, fieldName: string): any {
    const formData = this.formState.value[formName];
    return formData ? formData[fieldName] : null;
  }

  /**
   * Get all data for a specific form
   * @param formName Name of the form
   */
  getFormData(formName: string): Record<string, any> {
    return this.formState.value[formName] || {};
  }

  /**
   * Get observable stream of form state
   * Useful for reactive updates
   */
  getFormState(): Observable<FormState> {
    return this.formState.asObservable();
  }

  /**
   * Get observable stream of specific form's data
   * @param formName Name of the form
   */
  getFormDataObservable(formName: string): Observable<Record<string, any>> {
    return new BehaviorSubject(this.getFormData(formName)).asObservable();
  }

  /**
   * Clear data for a specific form
   * @param formName Name of the form
   */
  clearFormData(formName: string): void {
    const currentState = this.formState.value;
    delete currentState[formName];
    this.formState.next({ ...currentState });
    this.persistToStorage();
  }

  /**
   * Clear all form data (called on logout)
   */
  clearAllData(): void {
    this.formState.next({});
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if form has saved data
   * @param formName Name of the form
   */
  hasFormData(formName: string): boolean {
    return !!this.formState.value[formName] && Object.keys(this.formState.value[formName]).length > 0;
  }

  /**
   * Get all saved forms
   */
  getSavedForms(): string[] {
    return Object.keys(this.formState.value);
  }

  /**
   * Load form data from localStorage (called on service initialization)
   */
  private loadFormData(): void {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        this.formState.next(parsedData);
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Persist current form state to localStorage
   */
  private persistToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.formState.value));
    } catch (error) {
      console.error('Error persisting form data to localStorage:', error);
    }
  }

  /**
   * Get storage capacity info (for debugging)
   */
  getStorageInfo(): { used: number; available: number } {
    const used = new Blob(Object.values(localStorage)).size;
    return {
      used,
      available: 5242880 // 5MB typical limit
    };
  }
}
