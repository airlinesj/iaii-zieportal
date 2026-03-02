import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="landing-container">
      <div class="landing-content">
        <div class="logo-section">
          <img src="assets/zielogo.png" alt="Zimbabwe Institution of Engineers Logo" class="landing-logo" />
        </div>
        
        <h1 class="landing-title">ZIMBABWE INSTITUTION OF ENGINEERS</h1>
        
        <p class="landing-subtitle">Professional Membership Application Portal</p>
        
        <div class="landing-description">
          <p>Welcome to the Zimbabwe Institution of Engineers Membership Application Portal. Apply for professional membership and advance your engineering career.</p>
        </div>

        <div class="cta-buttons">
          <a routerLink="/login" class="btn-login">
            <span class="material-symbols-outlined">lock_person</span>
            Sign In
          </a>
          <a routerLink="/register" class="btn-register">
            <span class="material-symbols-outlined">app_registration</span>
            Create Account
          </a>
        </div>

        <div class="features">
          <div class="feature-item">
            <span class="feature-icon">✓</span>
            <h3>Easy Application</h3>
            <p>Complete Form M1 step by step</p>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✓</span>
            <h3>Professional Review</h3>
            <p>Expert assessment of your credentials</p>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✓</span>
            <h3>Secure Process</h3>
            <p>Your data is protected and confidential</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #023F82;
      padding: 20px;
    }

    .landing-content {
      text-align: center;
      background-color: #FFFFFF;
      border: 2.5px solid #B99532;
      border-radius: 8px;
      padding: 60px 40px;
      max-width: 600px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .logo-section {
      margin-bottom: 30px;
    }

    .landing-logo {
      height: 100px;
      width: auto;
    }

    .landing-title {
      font-family: 'Poppins', sans-serif;
      font-size: 48px;
      font-weight: 900;
      color: #004A59;
      margin: 20px 0 10px 0;
      letter-spacing: 1px;
    }

    .landing-subtitle {
      font-family: 'Poppins', sans-serif;
      font-size: 20px;
      color: #B99532;
      margin-bottom: 30px;
      font-weight: 700;
    }

    .landing-description {
      font-size: 14px;
      color: #555;
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .cta-buttons {
      display: flex;
      gap: 15px;
      margin-bottom: 50px;
      justify-content: center;
    }

    .btn-login, .btn-register, .btn-view-details {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 30px;
      font-size: 16px;
      font-weight: 700;
      border: 2.5px solid #004A59;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 200px;
    }

    .btn-login {
      background-color: #004A59;
      color: #FFFFFF;
    }

    .btn-login:hover {
      background-color: #003A47;
      border-color: #B99532;
    }

    .btn-register {
      background-color: #B99532;
      color: #004A59;
    }

    .btn-register:hover {
      background-color: #a58628;
      border-color: #004A59;
    }

    .btn-view-details {
      background-color: #FFFFFF;
      color: #004A59;
      border-color: #B99532;
    }

    .btn-view-details:hover {
      background-color: #f0f0f0;
      border-color: #004A59;
    }

    .btn-icon {
      font-size: 24px;
      font-variation-settings: 'wght' 600;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      padding-top: 30px;
      border-top: 2.5px solid #B99532;
    }

    .feature-item {
      padding: 15px;
    }

    .feature-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background-color: #B99532;
      color: #FFFFFF;
      border-radius: 50%;
      font-weight: 700;
      margin-bottom: 10px;
      font-size: 24px;
      flex-shrink: 0;
    }

    .feature-item h3 {
      font-size: 14px;
      color: #004A59;
      margin: 10px 0 5px 0;
      font-weight: 700;
    }

    .feature-item p {
      font-size: 12px;
      color: #666;
      margin: 0;
    }

    @media (max-width: 768px) {
      .landing-content {
        padding: 40px 20px;
      }

      .landing-title {
        font-size: 28px;
      }

      .landing-subtitle {
        font-size: 18px;
        margin-bottom: 25px;
      }

      .landing-logo {
        height: 80px;
      }

      .cta-buttons {
        flex-direction: column;
        gap: 12px;
        margin-bottom: 40px;
      }

      .btn-login, .btn-register {
        min-width: 100%;
        padding: 12px 20px;
        font-size: 15px;
      }

      .landing-description {
        font-size: 13px;
        margin-bottom: 30px;
      }

      .features {
        gap: 15px;
        padding-top: 25px;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      }

      .feature-item {
        padding: 12px;
      }

      .feature-item h3 {
        font-size: 12px;
        margin: 8px 0 4px 0;
      }

      .feature-item p {
        font-size: 11px;
      }
    }

    @media (max-width: 480px) {
      .landing-container {
        padding: 15px;
        min-height: 100vh;
      }

      .landing-content {
        padding: 30px 15px;
        max-width: 100%;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      }

      .landing-logo {
        height: 60px;
        margin-bottom: 15px;
      }

      .landing-title {
        font-size: 22px;
        font-weight: 800;
        margin: 15px 0 8px 0;
        letter-spacing: 0.5px;
      }

      .landing-subtitle {
        font-size: 14px;
        margin-bottom: 20px;
        font-weight: 700;
      }

      .landing-description {
        font-size: 12px;
        margin-bottom: 25px;
        line-height: 1.5;
      }

      .cta-buttons {
        flex-direction: column;
        gap: 10px;
        margin-bottom: 30px;
      }

      .btn-login, .btn-register {
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 700;
        min-width: 100%;
        gap: 8px;
        border: 2.5px solid #004A59;
      }

      .btn-login {
        background-color: #004A59;
        color: #FFFFFF;
      }

      .btn-register {
        background-color: #B99532;
        color: #004A59;
      }

      .features {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 20px;
        border-top: 2.5px solid #B99532;
      }

      .feature-item {
        padding: 10px 12px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        text-align: left;
      }

      .feature-icon {
        width: 36px;
        height: 36px;
        font-size: 20px;
        flex-shrink: 0;
      }

      .feature-item h3 {
        font-size: 11px;
        margin: 0 0 3px 0;
      }

      .feature-item p {
        font-size: 10px;
        margin: 0;
      }

      .material-symbols-outlined {
        font-size: 20px;
      }
    }
  `]
})
export class LandingComponent {}
