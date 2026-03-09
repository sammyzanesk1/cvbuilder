import { useEffect, useState } from "react";

//type generic, passes in any type as arg in the debounce function...
//every time we type in the resume, we call useDebounce function, we want to update typed info(value) after a certain time (delay) has passed..we use set timeout
export default function useDebounce<T>(value: T, delay: number = 2000) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value); //update the state value after the set time delay and no changes occur
    }, delay);

    return () => clearTimeout(handler); //cancels the timeout each time value changes and the debouncer/timer starts runs again afresh
  }, [value, delay]);

  return debouncedValue; //returns the updated state
}
