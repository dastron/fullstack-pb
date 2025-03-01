import { RangeDatepicker } from "chakra-dayzed-datepicker";
import { useState } from "react";

const DateRangePicker = () => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date(), new Date()]);

  return <RangeDatepicker selectedDates={selectedDates} onDateChange={setSelectedDates} />;
};

export default DateRangePicker;
