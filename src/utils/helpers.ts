// src/utils/helpers.ts

// تبدیل عدد به رشته با جداکننده هزارگان (کاما) و اعداد فارسی
export const formatNumber = (num: number): string => {
    if (isNaN(num)) return '۰';
    const withCommas = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return toPersianDigits(withCommas);
  };
  
  export const toPersianDigits = (str: string): string => {
    const persianMap: { [key: string]: string } = {
      '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
      '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
    };
    return str.replace(/[0-9]/g, (d) => persianMap[d]);
  };
  
  
  // تبدیل ارقام فارسی و انگلیسی به عدد خالص (برای پردازش)
  export const toEnglishNumber = (str: string): number => {
    const persianDigits: { [key: string]: string } = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    let numericStr = str.replace(/[^0-9۰-۹]/g, '');
    numericStr = numericStr.replace(/[۰-۹]/g, (d) => persianDigits[d] || d);
    return parseInt(numericStr, 10) || 0;
  };
  
  export const toPersianDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const formatted = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
    return toPersianDigits(formatted);
  };


  // تبدیل تاریخ شمسی به میلادی برای فیلتر (ساده)
export const persianToDate = (persianStr: string): Date | null => {
    // این یک پیاده‌سازی ساده است. برای پروژه واقعی می‌تونید از کتابخانه moment-jalaali استفاده کنید.
    // ولی برای سادگی، فعلاً تاریخ رو به صورت میلادی از ورودی text دریافت می‌کنیم.
    // پیشنهاد می‌کنم از کتابخانه "react-native-persian-date-picker" برای انتخاب تاریخ استفاده کنید.
    // ولی اینجا یه فیلتر متنی می‌سازیم که کاربر عبارت "1403/01/01" وارد کنه.
    return null;
  };
  
  // گرفتن تاریخ امروز به فرمت YYYY-MM-DD
  export const todayISO = (): string => {
    return new Date().toISOString().split('T')[0];
  };