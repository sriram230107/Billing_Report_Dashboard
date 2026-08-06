export function numberToIndianWords(amount: number): string {
  const num = Math.floor(amount);
  if (num === 0) return "Zero Rupees only";

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function translate(n: number): string {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  }

  let result = "";
  let remainder = num;

  // Crores
  if (remainder >= 10000000) {
    const crores = Math.floor(remainder / 10000000);
    result += translate(crores) + "Crore ";
    remainder %= 10000000;
  }

  // Lakhs
  if (remainder >= 100000) {
    const lakhs = Math.floor(remainder / 100000);
    result += translate(lakhs) + "Lakh ";
    remainder %= 100000;
  }

  // Thousands
  if (remainder >= 1000) {
    const thousands = Math.floor(remainder / 1000);
    result += translate(thousands) + "Thousand ";
    remainder %= 1000;
  }

  // Hundreds & Tens
  if (remainder > 0) {
    result += translate(remainder);
  }

  return (result.trim() + " Rupees only").replace(/\s+/g, " ");
}
