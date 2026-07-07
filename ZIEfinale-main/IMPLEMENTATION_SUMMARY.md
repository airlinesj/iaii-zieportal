# CPD Fee Calculation Implementation Summary

## What Has Been Implemented

### 1. **Fee Calculation Service** (`CpdPaymentService.ts`)

#### New Fee Structure (Duration-Based)
```typescript
export const CPD_DURATION_FEES = {
  'halfDay': { label: 'Half day course', usdFee: 40.00 },
  'fullDay': { label: 'Full day course', usdFee: 75.00 },
  'twoDay': { label: 'Two-day course', usdFee: 100.00 },
  'threeSeven': { label: 'Three to seven-day course', usdFee: 125.00 },
  'moreSeven': { label: 'More than seven days', usdFee: 200.00 },
};
```

#### New Functions Added

1. **`calculateCpdDurationFeeUsd(durationDays: number)`**
   - Accepts course duration in days
   - Returns: `{ category, label, usdFee }`
   - Automatically categorizes duration and returns appropriate fee

2. **`convertUsdToLocalCurrency(usdCost: number, interbankRate: number)`**
   - Converts USD to local currency (ZWL)
   - Multiplies USD amount by interbank rate
   - Rounds to 2 decimal places

3. **`calculateCpdDurationFeeWithConversion(durationDays: number, interbankRate: number)`**
   - Complete calculation in both currencies
   - Returns: `CpdDurationFeeResult` object with:
     - Duration category and label
     - USD cost
     - ZWL cost
     - Interbank rate used
     - Currency pair
     - Formatted display strings

4. **`getCpdDurationFeeOptions()`**
   - Returns all available fee options
   - Array format ready for dropdown lists

### 2. **Controller Methods** (`cpdController.ts`)

#### 1. `calculateDurationFee`
- **Route:** `POST /api/cpd/calculate-fee`
- **Purpose:** Calculate CPD fee based on course duration
- **Features:**
  - Accepts course duration (days) from request body
  - Optionally accepts interbank rate
  - Auto-fetches current exchange rate if not provided
  - Returns fee in USD and ZWL
  - Comprehensive error handling

#### 2. `getDurationFeeOptions`
- **Route:** `GET /api/cpd/fee-options`
- **Purpose:** Get all available CPD fee options
- **Features:**
  - Returns all duration categories
  - Includes current interbank rate
  - Shows fees in both currencies
  - Ready for UI dropdown/selection

### 3. **New API Routes** (`cpdRoutes.ts`)

```typescript
// Public endpoints (no authentication required)
POST /api/cpd/calculate-fee          // Calculate fee for specific duration
GET /api/cpd/fee-options             // Get all fee options
```

### 4. **Integration with Existing Services**

- **ExchangeRateService Integration:**
  - Automatically fetches current USD to ZWL rate
  - Uses cached rate if available (1-hour cache)
  - Falls back to manually set rate if admin has configured one
  - Default fallback: 26.5 ZWL per USD

## Key Features

✅ **Dynamic Fee Calculation**
- Automatically determines fee category based on duration
- Supports fractional days (e.g., 0.5 for half-day)

✅ **Multi-Currency Support**
- All calculations in USD
- Automatic conversion to ZWL using current interbank rate
- Formatted display strings for user-friendly output

✅ **Exchange Rate Management**
- Automatic fetching from ZRB (Zimbabwe Reserve Bank)
- Admin override capability
- 1-hour caching to minimize API calls
- Fallback mechanisms for reliability

✅ **Error Handling**
- Validates course duration (minimum 0.5 days)
- Validates interbank rate (must be positive)
- Clear error messages for invalid inputs
- Comprehensive logging

✅ **Public Access**
- Fee calculation endpoints don't require authentication
- Allows frontend to calculate fees in real-time
- Improves user experience with instant fee estimates

## Example Usage Flow

```
User selects course duration (e.g., 2 days)
                    ↓
Frontend calls POST /api/cpd/calculate-fee
                    ↓
System calculates: 2 days → "Two-day course" → $100.00
                    ↓
System fetches current exchange rate (26.5 ZWL/USD)
                    ↓
System calculates: $100.00 × 26.5 = ZWL 2650.00
                    ↓
Returns to frontend:
{
  "durationCategory": "twoDay",
  "durationLabel": "Two-day course",
  "usdCost": 100.00,
  "zwlCost": 2650.00,
  "displayFormat": {
    "usd": "$100.00",
    "zwl": "ZWL 2650.00"
  }
}
                    ↓
Frontend displays:
"Course Fee: $100.00 (ZWL 2650.00)"
```

## Integration Points

### Backend Integration
1. **CpdApplication Submission:**
   - `courseDuration` field already exists in model
   - Fee can be calculated and stored before submission
   - Uses same `estimatedFee` field

2. **Payment Processing:**
   - Fee amount automatically determined from duration
   - No need for manual fee entry
   - Consistent pricing across all applications

### Frontend Integration (Angular/React)
```typescript
// Get all options for dropdown
const options = await fetch('/api/cpd/fee-options').then(r => r.json());

// Calculate fee when user selects duration
const feeData = await fetch('/api/cpd/calculate-fee', {
  method: 'POST',
  body: JSON.stringify({ courseDuration: userSelectedDays })
}).then(r => r.json());

// Display to user
display(`Fee: ${feeData.data.displayFormat.usd} / ${feeData.data.displayFormat.zwl}`);
```

## Testing

A comprehensive test suite is available in:
`/backend/src/tests/cpdFeeCalculation.test.ts`

Run tests with:
```bash
npm test -- cpdFeeCalculation.test.ts
```

Test coverage includes:
- ✅ All fee categories
- ✅ Currency conversion
- ✅ Error handling for invalid inputs
- ✅ Exchange rate fetching
- ✅ Complete calculation workflow

## File Changes Summary

| File | Changes |
|------|---------|
| `src/services/CpdPaymentService.ts` | Added duration-based fee structure and calculation functions |
| `src/controllers/cpdController.ts` | Added `calculateDurationFee` and `getDurationFeeOptions` methods |
| `src/routes/cpdRoutes.ts` | Added routes for fee calculation endpoints |
| `CPD_FEE_CALCULATION_GUIDE.md` | Comprehensive API documentation and usage guide |
| `src/tests/cpdFeeCalculation.test.ts` | Test suite demonstrating all functionality |

## Next Steps (Optional Enhancements)

1. **Frontend Integration:**
   - Add course duration selector to CPD application form
   - Display live fee calculation as user selects duration
   - Show both USD and ZWL amounts prominently

2. **Admin Dashboard:**
   - Add fee management interface
   - Allow override of individual course fees
   - View all course fees and exchange rates

3. **Notifications:**
   - Email confirmation with calculated fees
   - Exchange rate update notifications
   - Payment reminder with current fee amount

4. **Analytics:**
   - Track fee revenue by course duration
   - Monitor exchange rate fluctuations
   - Generate fee reports

## Verification

To verify the implementation is working:

```bash
# Test the fee calculation endpoint
curl -X POST http://localhost:5000/api/cpd/calculate-fee \
  -H "Content-Type: application/json" \
  -d '{"courseDuration": 2}'

# Get all fee options
curl http://localhost:5000/api/cpd/fee-options
```

Both endpoints should return successfully with the calculated fees and exchange rate information.
