import { IApplication } from '../models/Application';

/**
 * Grading Service
 * Evaluates applicants based on ZIE criteria and ECZ guidelines
 * Grades: Student, Graduate, Technician, Technologist, Member, Fellow
 */
class GradingService {
  /**
   * Evaluate and suggest a membership grade for an applicant
   * Based on:
   * - Education level (degree type, qualification)
   * - Years of relevant experience
   * - Current membership status (for Fellow grade)
   */
  evaluateGrade(application: IApplication): 'Student' | 'Graduate' | 'Technician' | 'Technologist' | 'Member' | 'Fellow' {
    // Extract education and experience data
    const educationQualifications = application.education.map(e => e.qualification.toLowerCase());
    const totalExperience = this.calculateTotalExperience(application.experience);
    const yearsPostGrad = this.calculateYearsPostGraduation(application.education);

    // Determine highest education level
    const hasEngHonours = educationQualifications.some(q => 
      q.includes('engineering') && (q.includes('honours') || q.includes('b.eng') || q.includes('bsc'))
    );
    
    const hasBTech = educationQualifications.some(q => 
      q.includes('b.tech') || q.includes('btech') || q.includes('technologist')
    );
    
    const hasHND = educationQualifications.some(q => 
      q.includes('hnd') || q.includes('higher national diploma')
    );
    
    const hasNationalDiploma = educationQualifications.some(q => 
      q.includes('national diploma') || q.includes('nd')
    );

    // Grade evaluation logic (ECZ criteria)
    
    // Fellow: Rare grade - requires existing Member status + 5+ years experience + age 40+
    // (Assumes we have historical membership status in real system)
    // For now, we won't auto-assign Fellow without membership history
    
    // Member: Engineering Degree (Honours) + 3+ years post-grad experience
    if (hasEngHonours && yearsPostGrad >= 3) {
      return 'Member';
    }
    
    // Technologist: B.Tech/HND + 3+ years structured post-grad training
    if ((hasBTech || hasHND) && yearsPostGrad >= 3) {
      return 'Technologist';
    }
    
    // Technician: National Diploma + 3+ years post-college experience
    if (hasNationalDiploma && yearsPostGrad >= 3) {
      return 'Technician';
    }
    
    // Graduate: Has engineering qualifications but less than 3 years experience
    if ((hasEngHonours || hasBTech || hasHND) && yearsPostGrad >= 0 && yearsPostGrad < 3) {
      return 'Graduate';
    }
    
    // Student: Has some engineering education but no formal qualification completion yet
    if (educationQualifications.some(q => q.includes('engineering'))) {
      return 'Student';
    }
    
    // Default to Student if no engineering background
    return 'Student';
  }

  /**
   * Calculate total years of work experience
   */
  private calculateTotalExperience(experience: any[]): number {
    if (!experience || experience.length === 0) {
      return 0;
    }

    let totalYears = 0;
    experience.forEach(exp => {
      const years = (exp.endYear || new Date().getFullYear()) - exp.startYear;
      totalYears += Math.max(0, years); // Avoid negative years
    });

    return totalYears;
  }

  /**
   * Calculate years since graduation (post-graduation experience)
   * Uses the year of the highest/most recent degree
   */
  private calculateYearsPostGraduation(education: any[]): number {
    if (!education || education.length === 0) {
      return 0;
    }

    // Find the most recent degree year
    const years = education.map(e => e.year).filter(y => y && y > 0);
    if (years.length === 0) {
      return 0;
    }

    const latestGraduationYear = Math.max(...years);
    const currentYear = new Date().getFullYear();
    
    return Math.max(0, currentYear - latestGraduationYear);
  }
}

export default new GradingService();
