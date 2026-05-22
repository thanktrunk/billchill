"use client";

const COMMON_CURRENCIES = [
  { code: "USD", label: "USD – US Dollar" },
  { code: "EUR", label: "EUR – Euro" },
  { code: "GBP", label: "GBP – British Pound" },
  { code: "JPY", label: "JPY – Japanese Yen" },
  { code: "VND", label: "VND – Vietnamese Dong" },
  { code: "AUD", label: "AUD – Australian Dollar" },
  { code: "CAD", label: "CAD – Canadian Dollar" },
  { code: "CHF", label: "CHF – Swiss Franc" },
  { code: "SGD", label: "SGD – Singapore Dollar" },
  { code: "HKD", label: "HKD – Hong Kong Dollar" },
  { code: "KRW", label: "KRW – South Korean Won" },
  { code: "CNY", label: "CNY – Chinese Yuan" },
];

export function CurrencyInput({
  defaultValue = "USD",
}: {
  defaultValue?: string;
}) {
  return (
    <>
      <input
        id="currency"
        name="currency"
        type="text"
        list="currency-list"
        defaultValue={defaultValue}
        maxLength={3}
        required
        placeholder="USD"
        className="w-full rounded-md border px-3 py-2 text-sm uppercase"
        onInput={(e) => {
          (e.target as HTMLInputElement).value = (
            e.target as HTMLInputElement
          ).value.toUpperCase();
        }}
      />
      <datalist id="currency-list">
        {COMMON_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </datalist>
    </>
  );
}
