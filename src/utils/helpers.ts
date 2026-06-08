// src/utils/helpers.ts
import moment from 'moment-jalaali';

// تنظیم locale فارسی برای moment
moment.loadPersian({ usePersianDigits: false, dialect: 'persian-modern' });

// تبدیل ارقام به فارسی
export const toPersianDigits = (str: string): string => {
  const persianMap: { [key: string]: string } = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return str.replace(/[0-9]/g, (d) => persianMap[d]);
};

// تبدیل ارقام فارسی/عربی به انگلیسی
export const toEnglishNumber = (str: string): number => {
  const persianDigits: { [key: string]: string } = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  let numericStr = str.replace(/[^0-9۰-۹]/g, '');
  numericStr = numericStr.replace(/[۰-۹]/g, (d) => persianDigits[d] || d);
  return parseInt(numericStr, 10) || 0;
};

// تبدیل تاریخ ISO به شمسی با استفاده از moment-jalaali
export const toPersianDate = (isoDate: string): string => {
  const m = moment(isoDate);
  // فرمت: سال/ماه/روز ساعت:دقیقه
  const jalali = m.format('jYYYY/jMM/jDD HH:mm');
  // تبدیل اعداد انگلیسی به فارسی
  return toPersianDigits(jalali);
};

// فرمت اعداد با کاما و فارسی
export const formatNumber = (num: number): string => {
  if (isNaN(num)) return '۰';
  const withCommas = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toPersianDigits(withCommas);
};

// نمایش تاریخ تراکنش همراه با ویرایش
export const formatTransactionDate = (createdAt: string, updatedAt?: string): string => {
  const created = toPersianDate(createdAt);
  if (!updatedAt) return `📅 ${created}`;
  const edited = toPersianDate(updatedAt);
  return `📅 ${created} \t  ✏️ ${edited}`;
};