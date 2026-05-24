'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COMMON_CURRENCIES = [
  { code: 'USD', label: 'USD – US Dollar' },
  { code: 'EUR', label: 'EUR – Euro' },
  { code: 'GBP', label: 'GBP – British Pound' },
  { code: 'JPY', label: 'JPY – Japanese Yen' },
  { code: 'VND', label: 'VND – Vietnamese Dong' },
  { code: 'AUD', label: 'AUD – Australian Dollar' },
  { code: 'CAD', label: 'CAD – Canadian Dollar' },
  { code: 'CHF', label: 'CHF – Swiss Franc' },
  { code: 'SGD', label: 'SGD – Singapore Dollar' },
  { code: 'HKD', label: 'HKD – Hong Kong Dollar' },
  { code: 'KRW', label: 'KRW – South Korean Won' },
  { code: 'CNY', label: 'CNY – Chinese Yuan' },
  { code: 'THB', label: 'THB – Thai Baht' },
  { code: 'MYR', label: 'MYR – Malaysian Ringgit' },
  { code: 'IDR', label: 'IDR – Indonesian Rupiah' },
  { code: 'INR', label: 'INR – Indian Rupee' },
  { code: 'SEK', label: 'SEK – Swedish Krona' },
  { code: 'NOK', label: 'NOK – Norwegian Krone' },
  { code: 'DKK', label: 'DKK – Danish Krone' },
  { code: 'NZD', label: 'NZD – New Zealand Dollar' },
]

export function CurrencyInput({ defaultValue = 'USD' }: { defaultValue?: string }) {
  return (
    <Select name="currency" defaultValue={defaultValue}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {COMMON_CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
