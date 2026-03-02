import { Component } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DynamicValidationModalComponent } from './dynamic-validation-modal.component';

/**
 * USAGE GUIDE: DynamicValidationModalComponent
 * 
 * This reusable modal provides:
 * - Centered modal overlay with darkened background
 * - Dynamic country selection (Zimbabwe, South Africa, Botswana, Lesotho, Namibia)
 * - Regex-based ID validation based on selected country
 * - Mandatory years of experience field validation
 * - Optional additional field for custom input
 * 
 * EXAMPLE 1: Basic Usage
 * =====================
 * 
 * In your component:
 * 
 *   constructor(private dialog: MatDialog) {}
 *   
 *   openValidationModal() {
 *     this.dialog.open(DynamicValidationModalComponent, {
 *       width: '500px',
 *       disableClose: false,
 *       data: {
 *         title: 'Verify Your Identity',
 *         country: this.currentUser?.country
 *       }
 *     }).afterClosed().subscribe(result => {
 *       if (result) {
 *         console.log('Validation Data:', result);
 *         // {
 *         //   country: 'Zimbabwe',
 *         //   idNumber: '63-234567-D-48',
 *         //   yearsOfExperience: 10,
 *         //   additionalInfo: ''
 *         // }
 *       }
 *     });
 *   }
 * 
 * 
 * EXAMPLE 2: With Additional Field
 * ==================================
 * 
 *   openValidationModal() {
 *     this.dialog.open(DynamicValidationModalComponent, {
 *       width: '500px',
 *       disableClose: false,
 *       data: {
 *         title: 'Complete Your Profile Verification',
 *         additionalField: {
 *           label: 'Professional Summary',
 *           placeholder: 'Describe your engineering background',
 *           type: 'textarea',
 *           required: true
 *         }
 *       }
 *     }).afterClosed().subscribe(result => {
 *       if (result) {
 *         this.processVerification(result);
 *       }
 *     });
 *   }
 * 
 * 
 * EXAMPLE 3: In Expatriate Form
 * =============================
 * 
 * In expatriate-form.component.ts:
 * 
 *   import { DynamicValidationModalComponent } from '../components/dynamic-validation-modal.component';
 *   
 *   export class ExpatriateFormComponent implements OnInit {
 *     constructor(private dialog: MatDialog) {}
 *     
 *     verifyExpatriate() {
 *       this.dialog.open(DynamicValidationModalComponent, {
 *         width: '500px',
 *         data: {
 *           title: 'Expatriate Verification',
 *           country: 'Zimbabwe'
 *         }
 *       }).afterClosed().subscribe(result => {
 *         if (result) {
 *           // Update form with validated data
 *           this.personalParticularsForm.patchValue({
 *             country: result.country,
 *             idNumber: result.idNumber,
 *             nationality: result.country
 *           });
 *           
 *           this.experienceForm.patchValue({
 *             yearsOfExperience: result.yearsOfExperience
 *           });
 *         }
 *       });
 *     }
 *   }
 * 
 * 
 * FEATURES
 * ========
 * 
 * 1. COUNTRY PATTERNS (Regex Validation):
 *    - Zimbabwe:   00-000000-X-00  (2 digits-6 digits-letter-2 digits)
 *    - South Africa:  13 digits
 *    - Botswana:   XX000000/00 (2 letters-6 digits-serial)
 *    - Lesotho:    000000000X00 (9 digits-letter-2 digits)
 *    - Namibia:    000000 00000 (6 digits space 5 digits)
 * 
 * 2. DYNAMIC VALIDATION:
 *    - Shows country-specific placeholder
 *    - Displays format description
 *    - Provides example ID
 *    - Real-time validation feedback
 * 
 * 3. YEARS OF EXPERIENCE:
 *    - Mandatory field
 *    - Must be numeric
 *    - Range: 0-70 years
 *    - Real-time validation
 * 
 * 4. OPTIONAL ADDITIONAL FIELD:
 *    - Can be text input or textarea
 *    - Can be made required
 *    - Flexibility for custom use cases
 * 
 * 
 * STYLING
 * =======
 * 
 * - Centered modal with darkened overlay (rgba(0,0,0,0.5))
 * - Smooth animations (fade-in + slide-up)
 * - Responsive design (works on mobile)
 * - Color scheme matches existing brand (004A59, B99532)
 * - Professional form styling with proper spacing
 * 
 * 
 * INTEGRATION STEPS
 * =================
 * 
 * 1. Import in your component:
 *    import { DynamicValidationModalComponent } from '../components/dynamic-validation-modal.component';
 * 
 * 2. Add MatDialog to your component's dependencies:
 *    constructor(private dialog: MatDialog) {}
 * 
 * 3. Call openValidationModal() when needed
 * 
 * 4. Handle the result in afterClosed().subscribe()
 * 
 * 
 * CUSTOMIZATION
 * ==============
 * 
 * You can extend this modal with more countries by modifying
 * CountryValidationService's idPatterns dictionary.
 * 
 * Add new country pattern:
 * 
 *   private idPatterns = {
 *     yourcountry: {
 *       country: 'Your Country',
 *       pattern: /^your-regex-pattern$/,
 *       placeholder: 'XX000000',
 *       description: 'Your format description',
 *       example: 'AB123456'
 *     }
 *   };
 */

@Component({
  selector: 'app-validation-modal-usage-example',
  standalone: true,
  imports: [CommonModule, JsonPipe],
  template: `
    <div class="usage-container">
      <h1>Dynamic Validation Modal - Usage Examples</h1>
      
      <section>
        <h2>Example 1: Basic Verification</h2>
        <button (click)="openBasicModal()">Open Basic Modal</button>
      </section>
      
      <section>
        <h2>Example 2: With Additional Field</h2>
        <button (click)="openModalWithAdditionalField()">Open With Additional Field</button>
      </section>
      
      <section>
        <h2>Example 3: Pre-filled Country</h2>
        <button (click)="openModalWithPrefilledCountry()">Open With Pre-filled Country</button>
      </section>

      <div class="result" *ngIf="lastResult">
        <h3>Last Modal Result:</h3>
        <pre>{{ lastResult | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .usage-container {
      padding: 30px;
      max-width: 800px;
      margin: 0 auto;
    }

    section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    section h2 {
      margin-top: 0;
      color: #004A59;
    }

    button {
      padding: 10px 20px;
      background-color: #004A59;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover {
      background-color: #003039;
    }

    .result {
      margin-top: 30px;
      padding: 20px;
      background-color: #e8f5e9;
      border: 2px solid #388e3c;
      border-radius: 8px;
    }

    .result h3 {
      color: #388e3c;
      margin-top: 0;
    }

    pre {
      background-color: white;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }
  `]
})
export class ValidationModalUsageExampleComponent {
  lastResult: any = null;

  constructor(private dialog: MatDialog) {}

  openBasicModal() {
    this.dialog.open(DynamicValidationModalComponent, {
      width: '500px',
      disableClose: false,
      data: {
        title: 'Verify Your Identity'
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.lastResult = result;
      }
    });
  }

  openModalWithAdditionalField() {
    this.dialog.open(DynamicValidationModalComponent, {
      width: '500px',
      disableClose: false,
      data: {
        title: 'Complete Your Verification',
        additionalField: {
          label: 'Professional Summary',
          placeholder: 'Describe your engineering expertise and experience',
          type: 'textarea',
          required: true
        }
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.lastResult = result;
      }
    });
  }

  openModalWithPrefilledCountry() {
    this.dialog.open(DynamicValidationModalComponent, {
      width: '500px',
      disableClose: false,
      data: {
        title: 'Pre-filled Country Example',
        country: 'Zimbabwe',
        yearsOfExperience: 5
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.lastResult = result;
      }
    });
  }
}
