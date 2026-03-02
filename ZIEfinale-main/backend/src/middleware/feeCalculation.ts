import { Request, Response, NextFunction } from 'express';

export interface FeeRequest extends Request {
  exchangeRate?: number;
  calculatedFee?: number;
}

export const feeCalculationMiddleware = (req: FeeRequest, res: Response, next: NextFunction) => {
  const exchangeRate = parseFloat(process.env.EXCHANGE_RATE || '0.015');
  const baseFee = req.body.baseFee || 50; // Default base fee in USD

  // Calculate fee based on exchange rate
  const calculatedFee = Math.round(baseFee / exchangeRate * 100) / 100;

  req.exchangeRate = exchangeRate;
  req.calculatedFee = calculatedFee;

  next();
};

export const calculateApplicationFee = (baseFeeUSD: number, exchangeRateZWL: number): number => {
  return Math.round((baseFeeUSD / exchangeRateZWL) * 100) / 100;
};
