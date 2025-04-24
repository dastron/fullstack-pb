import { memo, useMemo } from "react";

interface DateRelativeTextProps {
  date: string | Date;
}

const DateRelativeText = memo(({ date }: DateRelativeTextProps) => {
  const getRelativeTimeText = useMemo(() => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30.44); // Average days in a month
    const diffInYears = Math.floor(diffInDays / 365.25); // Account for leap years

    if (diffInSeconds > 0) {
      switch (true) {
        case diffInSeconds < 30:
          return "just now";
        case diffInSeconds < 60:
          return "less than a minute ago";
        case diffInMinutes === 1:
          return "1 minute ago";
        case diffInMinutes < 60:
          return `${diffInMinutes} minutes ago`;
        case diffInHours === 1:
          return "1 hour ago";
        case diffInHours < 24:
          return `${diffInHours} hours ago`;
        case diffInDays === 1:
          return "yesterday";
        case diffInDays < 7:
          return `${diffInDays} days ago`;
        case diffInDays < 14:
          return "last week";
        case diffInDays < 30:
          return "this month";
        case diffInDays < 60:
          return "last month";
        case diffInMonths === 1:
          return "last month";
        case diffInMonths < 12:
          return `${diffInMonths} months ago`;
        case diffInYears === 1:
          return "last year";
        case diffInYears < 5:
          return `${diffInYears} years ago`;
        default:
          return targetDate.toLocaleDateString();
      }
    } else {
      switch (true) {
        case diffInSeconds > -30:
          return "just now";
        case diffInSeconds > -60:
          return "in less than a minute";
        case diffInMinutes === -1:
          return "in 1 minute";
        case diffInMinutes > -60:
          return `in ${Math.abs(diffInMinutes)} minutes`;
        case diffInHours === -1:
          return "in 1 hour";
        case diffInHours > -24:
          return `in ${Math.abs(diffInHours)} hours`;
        case diffInDays === -1:
          return "tomorrow";
        case diffInDays > -7:
          return `in ${Math.abs(diffInDays)} days`;
        case diffInDays > -14:
          return "next week";
        case diffInDays > -30:
          return "next month";
        case diffInDays > -60:
          return "next month";
        case diffInMonths === -1:
          return "next month";
        case diffInMonths > -12:
          return `in ${Math.abs(diffInMonths)} months`;
        case diffInYears === -1:
          return "next year";
        case diffInYears > -5:
          return `in ${Math.abs(diffInYears)} years`;
        default:
          return targetDate.toLocaleDateString();
      }
    }
  }, [date]);

  return <span>{getRelativeTimeText}</span>;
});

export default DateRelativeText;
