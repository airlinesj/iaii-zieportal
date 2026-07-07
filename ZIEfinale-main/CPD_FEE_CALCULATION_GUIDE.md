# CPD Fee Calculation Implementation Guide

## Overview

This guide explains the CPD (Continuing Professional Development) course fee calculation feature for the ZIE membership portal. The feature automatically calculates course fees in USD and converts them to ZWL (Zimbabwe currency) using the current interbank exchange rate.

## Fee Structure

The CPD fee structure is based on course duration:

| Duration | Description | USD Cost |
|----------|-------------|----------|
| < 1 day | Half day course | $40.00 |
| 1 day | Full day course | $75.00 |
| 2 days | Two-day course | $100.00 |
| 3-7 days | Three to seven-day course | $125.00 |
| > 7 days | More than seven days | $200.00 |

## API Endpoints

### 1. Calculate CPD Fee

**Endpoint:** `POST /api/cpd/calculate-fee`

**Description:** Calculate the CPD fee based on course duration and convert to local currency.

**Request Body:**
```json
{
  "courseDuration": 2,
  "interbankRate": 26.5
}
```

**Parameters:**
- `courseDuration` (number, required): Duration of the course in days (can be decimal, e.g., 0.5 for half-day)
- `interbankRate` (number, optional): Current USD to ZWL exchange rate. If not provided, the system will fetch the current rate automatically.

**Success Response (200):**
```json
{
  "success": true,
  "message": "CPD fee calculated successfully",
  "data": {
    "courseDuration": 2,
    "durationCategory": "twoDay",
    "durationLabel": "Two-day course",
    "usdCost": 100.00,
    "interbankRate": 26.5,
    "zwlCost": 2650.00,
    "currencyPair": "USD/ZWL",
    "displayFormat": {
      "usd": "$100.00",
      "zwl": "ZWL 2650.00"
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Course duration must be a positive number (minimum 0.5 for half-day)"
}
```

### 2. Get Available Fee Options

**Endpoint:** `GET /api/cpd/fee-options`

**Description:** Retrieve all available CPD duration categories with their fees in both currencies.

**Request Parameters:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "CPD duration fee options retrieved successfully",
  "interbankRate": 26.5,
  "currencyPair": "USD/ZWL",
  "options": [
    {
      "key": "halfDay",
      "label": "Half day course",
      "usdFee": 40.00,
      "zwlFee": 1060.00,
      "displayFormat": {
        "usd": "$40.00",
        "zwl": "ZWL 1060.00"
      }
    },
    {
      "key": "fullDay",
      "label": "Full day course",
      "usdFee": 75.00,
      "zwlFee": 1987.50,
      "displayFormat": {
        "usd": "$75.00",
        "zwl": "ZWL 1987.50"
      }
    },
    {
      "key": "twoDay",
      "label": "Two-day course",
      "usdFee": 100.00,
      "zwlFee": 2650.00,
      "displayFormat": {
        "usd": "$100.00",
        "zwl": "ZWL 2650.00"
      }
    },
    {
      "key": "threeSeven",
      "label": "Three to seven-day course",
      "usdFee": 125.00,
      "zwlFee": 3312.50,
      "displayFormat": {
        "usd": "$125.00",
        "zwl": "ZWL 3312.50"
      }
    },
    {
      "key": "moreSeven",
      "label": "More than seven days",
      "usdFee": 200.00,
      "zwlFee": 5300.00,
      "displayFormat": {
        "usd": "$200.00",
        "zwl": "ZWL 5300.00"
      }
    }
  ]
}
```

## Usage Examples

### Example 1: Calculate fee for a 2-day course

**Request:**
```bash
curl -X POST http://localhost:5000/api/cpd/calculate-fee \
  -H "Content-Type: application/json" \
  -d '{
    "courseDuration": 2
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "CPD fee calculated successfully",
  "data": {
    "courseDuration": 2,
    "durationCategory": "twoDay",
    "durationLabel": "Two-day course",
    "usdCost": 100.00,
    "interbankRate": 26.5,
    "zwlCost": 2650.00,
    "currencyPair": "USD/ZWL",
    "displayFormat": {
      "usd": "$100.00",
      "zwl": "ZWL 2650.00"
    }
  }
}
```

### Example 2: Calculate fee for a half-day course

**Request:**
```bash
curl -X POST http://localhost:5000/api/cpd/calculate-fee \
  -H "Content-Type: application/json" \
  -d '{
    "courseDuration": 0.5
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "CPD fee calculated successfully",
  "data": {
    "courseDuration": 0.5,
    "durationCategory": "halfDay",
    "durationLabel": "Half day course",
    "usdCost": 40.00,
    "interbankRate": 26.5,
    "zwlCost": 1060.00,
    "currencyPair": "USD/ZWL",
    "displayFormat": {
      "usd": "$40.00",
      "zwl": "ZWL 1060.00"
    }
  }
}
```

### Example 3: Calculate fee for a 5-day course

**Request:**
```bash
curl -X POST http://localhost:5000/api/cpd/calculate-fee \
  -H "Content-Type: application/json" \
  -d '{
    "courseDuration": 5
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "CPD fee calculated successfully",
  "data": {
    "courseDuration": 5,
    "durationCategory": "threeSeven",
    "durationLabel": "Three to seven-day course",
    "usdCost": 125.00,
    "interbankRate": 26.5,
    "zwlCost": 3312.50,
    "currencyPair": "USD/ZWL",
    "displayFormat": {
      "usd": "$125.00",
      "zwl": "ZWL 3312.50"
    }
  }
}
```

### Example 4: Get all fee options

**Request:**
```bash
curl -X GET http://localhost:5000/api/cpd/fee-options
```

## Integration with Frontend

### React/Angular Example

```typescript
// Service to fetch CPD fees
async function getCPDFeeOptions() {
  const response = await fetch('/api/cpd/fee-options');
  return response.json();
}

// Calculate fee when user selects duration
async function calculateCPDFee(durationDays: number) {
  const response = await fetch('/api/cpd/calculate-fee', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      courseDuration: durationDays
    })
  });
  return response.json();
}

// Form submission
async function handleCourseSubmit(formData: any) {
  // Get course duration from form
  const { courseDuration } = formData;
  
  // Calculate fee
  const feeData = await calculateCPDFee(courseDuration);
  
  if (feeData.success) {
    // Display fee to user
    console.log(`USD Cost: ${feeData.data.displayFormat.usd}`);
    console.log(`ZWL Cost: ${feeData.data.displayFormat.zwl}`);
    
    // Store fee in form submission
    const submissionData = {
      ...formData,
      estimatedFee: feeData.data.usdCost,
      paymentCurrency: 'USD'
    };
  }
}
```

## Implementation Details

### Service Functions

The following functions are available in `CpdPaymentService.ts`:

1. **`calculateCpdDurationFeeUsd(durationDays: number)`**
   - Calculates the fee category and USD amount based on course duration
   - Returns: `{ category, label, usdFee }`

2. **`convertUsdToLocalCurrency(usdCost: number, interbankRate: number)`**
   - Converts USD amount to local currency using the interbank rate
   - Returns: `number` (ZWL amount)

3. **`calculateCpdDurationFeeWithConversion(durationDays: number, interbankRate: number)`**
   - Complete calculation in both currencies
   - Returns: `CpdDurationFeeResult` object with all details

4. **`getCpdDurationFeeOptions()`**
   - Gets all available fee options
   - Returns: Array of fee options

### Exchange Rate Management

The system automatically fetches the current USD to ZWL interbank rate using the `ExchangeRateService`:

- **Automatic Rate Fetching:** If no `interbankRate` is provided in the API request, the system fetches the current rate
- **Manual Override:** Admins can manually set the exchange rate through system settings
- **Caching:** Rates are cached for 1 hour to reduce API calls
- **Fallback Rate:** Default rate of 26.5 ZWL per USD is used if the service is unavailable

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Missing course duration | 400 | "Course duration is required" |
| Invalid duration (< 0.5) | 400 | "Course duration must be a positive number (minimum 0.5 for half-day)" |
| Invalid interbank rate | 400 | "Invalid interbank rate" |
| Server error | 500 | "Error calculating CPD fee" |

## Notes

- All fees are calculated to 2 decimal places
- Course durations can be fractional (e.g., 0.5 for half-day, 1.5 for 1.5 days)
- The exchange rate is updated hourly by default
- Admin users can manually override the exchange rate in system settings
- The fee calculation is integrated into the CPD application submission process
