/**
 * Division Mapping Service
 * Maps degree titles to ZIE specialist divisions
 * Uses keyword-based "best fit" matching algorithm
 */
class DivisionMappingService {
  private divisionKeywords: { [key: string]: string[] } = {
    'Structural Engineering': ['structural', 'reinforced concrete', 'steel structure', 'construction'],
    'Geotechnical Engineering': ['geotechnical', 'soil', 'foundation', 'ground', 'rock'],
    'Water Resources Engineering': ['water', 'hydro', 'dam', 'irrigation', 'sewerage', 'supply'],
    'Transportation Engineering': ['transport', 'road', 'highway', 'traffic', 'railway', 'airport'],
    'Energy Engineering': ['energy', 'power', 'electrical power', 'generation', 'transmission', 'distribution'],
    'Building Services Engineering': ['building services', 'hvac', 'mechanical services', 'plumbing', 'electrical installation'],
    'Computer Engineering & ICT': ['computer', 'ict', 'software', 'networks', 'telecommunications', 'electronics'],
    'Industrial and Manufacturing Engineering': ['industrial', 'manufacturing', 'production', 'mechanical', 'process', 'metallurgy'],
    'Chemical Engineering': ['chemical', 'mining', 'mineral', 'process engineering', 'petroleum'],
    'Agricultural Engineering': ['agricultural', 'farm', 'irrigation', 'machinery'],
    'Environmental Engineering': ['environmental', 'waste', 'pollution', 'climate', 'sustainability'],
    'Biomedical Engineering': ['biomedical', 'medical', 'healthcare', 'biological'],
  };

  /**
   * Assign a specialist division based on degree title
   * Uses keyword matching to find the best fit
   * @param degreeTitle - The degree title/major from the application
   * @returns The suggested specialist division
   */
  assignDivision(degreeTitle: string): string {
    if (!degreeTitle || typeof degreeTitle !== 'string') {
      return 'General Engineering';
    }

    const normalizedTitle = degreeTitle.toLowerCase().trim();
    let bestMatch = '';
    let bestScore = 0;

    // Score each division based on keyword matches
    for (const [division, keywords] of Object.entries(this.divisionKeywords)) {
      let score = 0;

      for (const keyword of keywords) {
        // Exact match scores higher
        if (normalizedTitle.includes(keyword)) {
          score += keyword.length; // Longer matches are more specific
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = division;
      }
    }

    // Return best match if found, otherwise return based on first keyword
    if (bestMatch) {
      return bestMatch;
    }

    // Fallback logic: check for common degree types
    if (normalizedTitle.includes('civil')) {
      return 'Structural Engineering'; // Most common civil engineering focus
    }
    if (normalizedTitle.includes('electrical')) {
      return 'Energy Engineering';
    }
    if (normalizedTitle.includes('computer') || normalizedTitle.includes('ict') || normalizedTitle.includes('it')) {
      return 'Computer Engineering & ICT';
    }
    if (normalizedTitle.includes('mechanical')) {
      return 'Industrial and Manufacturing Engineering';
    }
    if (normalizedTitle.includes('chemical')) {
      return 'Chemical Engineering';
    }
    if (normalizedTitle.includes('mining') || normalizedTitle.includes('geological')) {
      return 'Chemical Engineering'; // Mining often aligns with chemical/mineral engineering
    }

    // Default fallback
    return 'General Engineering';
  }

  /**
   * Get all available ZIE specialist divisions
   */
  getAllDivisions(): string[] {
    return Object.keys(this.divisionKeywords);
  }

  /**
   * Validate if a division is recognized by ZIE
   */
  isValidDivision(division: string): boolean {
    return Object.keys(this.divisionKeywords).includes(division) || division === 'General Engineering';
  }
}

export default new DivisionMappingService();
