import { Tooltip, Text } from "@chakra-ui/react";
import { memo, useMemo } from "react";

interface SmartDateProps {
  date: string | Date;
  showTooltip?: boolean;
  format?: Intl.DateTimeFormatOptions;
}

const SmartDate = memo(
  ({
    date,
    showTooltip = true,
    format = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  }: SmartDateProps) => {
    const { relativeText, exactText } = useMemo(() => {
      const now = new Date();
      const targetDate = new Date(date);
      const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

      // Future dates
      if (diffInSeconds < 0) {
        const absDiff = Math.abs(diffInSeconds);
        if (absDiff < 60)
          return { relativeText: "in a few seconds", exactText: targetDate.toLocaleString(undefined, format) };
        if (absDiff < 3600)
          return {
            relativeText: `in ${Math.floor(absDiff / 60)} minutes`,
            exactText: targetDate.toLocaleString(undefined, format),
          };
        if (absDiff < 86400)
          return {
            relativeText: `in ${Math.floor(absDiff / 3600)} hours`,
            exactText: targetDate.toLocaleString(undefined, format),
          };
        if (absDiff < 172800)
          return { relativeText: "tomorrow", exactText: targetDate.toLocaleString(undefined, format) };
      }

      // Past dates
      if (diffInSeconds < 30)
        return { relativeText: "just now", exactText: targetDate.toLocaleString(undefined, format) };
      if (diffInSeconds < 60)
        return { relativeText: "less than a minute ago", exactText: targetDate.toLocaleString(undefined, format) };
      if (diffInSeconds < 3600)
        return {
          relativeText: `${Math.floor(diffInSeconds / 60)} minutes ago`,
          exactText: targetDate.toLocaleString(undefined, format),
        };
      if (diffInSeconds < 7200)
        return { relativeText: "an hour ago", exactText: targetDate.toLocaleString(undefined, format) };
      if (diffInSeconds < 86400)
        return {
          relativeText: `${Math.floor(diffInSeconds / 3600)} hours ago`,
          exactText: targetDate.toLocaleString(undefined, format),
        };
      if (diffInSeconds < 172800)
        return { relativeText: "yesterday", exactText: targetDate.toLocaleString(undefined, format) };

      // Fallback to exact date for older dates
      return {
        relativeText: targetDate.toLocaleDateString(),
        exactText: targetDate.toLocaleString(undefined, format),
      };
    }, [date, format]);

    if (!showTooltip) {
      return <Text>{relativeText}</Text>;
    }

    return (
      <Tooltip label={exactText} placement="top" hasArrow bg="gray.700" color="white">
        <Text cursor="help">{relativeText}</Text>
      </Tooltip>
    );
  }
);

export default SmartDate;
