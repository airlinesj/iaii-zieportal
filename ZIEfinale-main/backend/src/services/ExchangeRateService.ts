/**
 * ExchangeRateService
 * Manages the current USD to ZWG exchange rate from Zimbabwe Reserve Bank
 * Caches the rate and refreshes it periodically
 * Supports manual admin override from database
 */

import axios from 'axios';
import SystemSettings from '../models/SystemSettings';

interface IExchangeRateCache {
  rate: number;
  fetchedAt: Date;
  expiresAt: Date;
  isManual: boolean;
}

export class ExchangeRateService {
  private static instance: ExchangeRateService;
  private cache: IExchangeRateCache | null = null;
  private cacheDurationMinutes = 60; // Refresh rate every hour
  private defaultRate = 26.5; // Updated default rate (26.5 ZWG per USD)

  private constructor() {}

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  /**
   * Get current exchange rate (USD to ZWG)
   * Priority 1: Manually set rate from admin (if recent)
   * Priority 2: Cached rate (if not expired)
   * Priority 3: Fresh rate from ZRB
   */
  async getExchangeRate(): Promise<number> {
    try {
      // Check if admin has manually set a rate
      const settings = await SystemSettings.findOne();
      if (settings && settings.isManuallySet) {
        // Use manually set rate for up to 24 hours
        const hoursSinceUpdate = (new Date().getTime() - settings.exchangeRateLastUpdatedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 24) {
          console.log(`✓ Using admin-set exchange rate: 1 USD = ZWG ${settings.exchangeRateUSDToZWG}`);
          // Update cache with manual rate
          const now = new Date();
          this.cache = {
            rate: settings.exchangeRateUSDToZWG,
            fetchedAt: now,
            expiresAt: new Date(now.getTime() + this.cacheDurationMinutes * 60 * 1000),
            isManual: true,
          };
          return settings.exchangeRateUSDToZWG;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error checking database for manual rate:', (error as Error).message);
    }

    // Check if cache is still valid
    if (this.cache && new Date() < this.cache.expiresAt) {
      console.log(`✓ Using cached exchange rate: 1 USD = ZWG ${this.cache.rate}`);
      return this.cache.rate;
    }

    // Fetch fresh rate from ZRB or fallback
    const rate = await this.fetchRateFromZRB();
    
    // Update cache
    const now = new Date();
    this.cache = {
      rate,
      fetchedAt: now,
      expiresAt: new Date(now.getTime() + this.cacheDurationMinutes * 60 * 1000),
      isManual: false,
    };

    console.log(`✓ Fetched fresh exchange rate: 1 USD = ZWG ${rate} (expires in ${this.cacheDurationMinutes}min)`);
    return rate;
  }

  /**
   * Fetch exchange rate from Zimbabwe Reserve Bank
   * Multiple fallbacks if API is unavailable
   */
  private async fetchRateFromZRB(): Promise<number> {
    try {
      // Try official ZRB API first
      const rate = await this.tryZRBOfficialAPI();
      if (rate > 0) {
        console.log(`📊 Exchange rate from ZRB Official API: 1 USD = ZWG ${rate}`);
        return rate;
      }
    } catch (error) {
      console.warn('⚠️ ZRB Official API unavailable, trying alternative sources...');
    }

    try {
      // Try alternative source
      const rate = await this.tryAlternativeSource();
      if (rate > 0) {
        console.log(`📊 Exchange rate from alternative source: 1 USD = ZWG ${rate}`);
        return rate;
      }
    } catch (error) {
      console.warn('⚠️ Alternative source unavailable, using configured fallback...');
    }

    // Use fallback rate from environment or default
    const fallbackRate = parseInt(process.env.USD_TO_ZWG_FALLBACK || String(this.defaultRate), 10);
    console.warn(`📊 Using fallback exchange rate: 1 USD = ZWG ${fallbackRate}`);
    return fallbackRate;
  }

  /**
   * Try to fetch from ZRB official API/endpoint
   * (Replace with actual ZRB endpoint when available)
   */
  private async tryZRBOfficialAPI(): Promise<number> {
    try {
      // Placeholder for actual ZRB API endpoint
      // ZRB publishes rates but API structure may vary
      const response = await axios.get('https://www.reserve.co.zw/api/exchange-rate', {
        timeout: 5000,
      });

      if (response.data?.usdRate) {
        return parseFloat(response.data.usdRate);
      }
    } catch (error) {
      console.warn('❌ ZRB API call failed:', (error as Error).message);
    }
    return 0;
  }

  /**
   * Try alternative exchange rate sources
   * (Could use external APIs like exchangerate-api.com, fixer.io, etc.)
   */
  private async tryAlternativeSource(): Promise<number> {
    try {
      // Example using a public exchange rate API
      // Note: You may need to register for an API key
      const apiKey = process.env.EXCHANGE_RATE_API_KEY;
      
      if (apiKey) {
        const response = await axios.get(
          `https://api.exchangerate-api.com/v4/latest/USD`,
          { timeout: 5000 }
        );

        if (response.data?.rates?.ZWG) {
          return parseFloat(response.data.rates.ZWG);
        }
      }

      // Fallback to fixer.io if available
      const fixerKey = process.env.FIXER_API_KEY;
      if (fixerKey) {
        const response = await axios.get(
          `https://api.fixer.io/latest?access_key=${fixerKey}&base=USD&symbols=ZWG`,
          { timeout: 5000 }
        );

        if (response.data?.rates?.ZWG) {
          return parseFloat(response.data.rates.ZWG);
        }
      }
    } catch (error) {
      console.warn('❌ Alternative source call failed:', (error as Error).message);
    }
    return 0;
  }

  /**
   * Manually set exchange rate (useful for admin override)
   * Updates both cache and database
   */
  async setExchangeRate(rate: number, adminId?: string, durationMinutes: number = 1440): Promise<void> {
    try {
      // Update database
      let settings = await SystemSettings.findOne();
      if (!settings) {
        settings = new SystemSettings();
      }
      
      settings.exchangeRateUSDToZWG = rate;
      settings.exchangeRateLastUpdatedAt = new Date();
      settings.isManuallySet = true;
      if (adminId) {
        settings.exchangeRateLastUpdatedBy = adminId as any;
      }
      
      await settings.save();
      console.log(`✓ Exchange rate updated in database: 1 USD = ZWG ${rate}`);
    } catch (error) {
      console.error('❌ Error updating exchange rate in database:', (error as Error).message);
    }

    // Update cache
    const now = new Date();
    this.cache = {
      rate,
      fetchedAt: now,
      expiresAt: new Date(now.getTime() + durationMinutes * 60 * 1000),
      isManual: true,
    };
    console.log(`✓ Exchange rate manually set: 1 USD = ZWG ${rate}`);
  }

  /**
   * Get current rate from cache or database
   */
  getCachedRate(): number | null {
    if (this.cache) {
      return this.cache.rate;
    }
    return null;
  }

  /**
   * Clear cache to force refresh on next request
   */
  clearCache(): void {
    this.cache = null;
    console.log('✓ Exchange rate cache cleared');
  }

  /**
   * Get exchange rate info including source and update time
   */
  async getExchangeRateInfo(): Promise<{
    rate: number;
    isManual: boolean;
    lastUpdated: Date;
    source: string;
  }> {
    try {
      const settings = await SystemSettings.findOne();
      if (settings) {
        return {
          rate: settings.exchangeRateUSDToZWG,
          isManual: settings.isManuallySet,
          lastUpdated: settings.exchangeRateLastUpdatedAt,
          source: settings.isManuallySet ? 'Admin Manual Override' : 'Auto-fetched (ZRB/API)',
        };
      }
    } catch (error) {
      console.warn('⚠️ Error getting exchange rate info:', (error as Error).message);
    }

    const rate = await this.getExchangeRate();
    return {
      rate,
      isManual: this.cache?.isManual || false,
      lastUpdated: this.cache?.fetchedAt || new Date(),
      source: this.cache?.isManual ? 'Admin Manual Override' : 'Auto-fetched (ZRB/API)',
    };
  }
}

// Export singleton instance
export const exchangeRateService = ExchangeRateService.getInstance();
