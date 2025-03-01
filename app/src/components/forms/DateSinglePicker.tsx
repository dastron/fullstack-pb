import { SingleDatepicker } from "chakra-dayzed-datepicker";
import { useState } from "react";

const DateSinglePicker = () => {
  const [date, setDate] = useState(new Date());

  <SingleDatepicker name="date-input" date={date} onDateChange={setDate} />;
};

export default DateSinglePicker;
