import { useEffect } from "react";

export default function useUnloadWarning(condition = true) {
  useEffect(() => {
    //if we call the hook with false...do not trigger page reload warning..early return/guard clause.
    if (!condition) {
      return;
    }

    //user tries to reload a page where this hook is called while there are unsaved changes...this hook will warn user....
    const listener = (event: BeforeUnloadEvent) => {
      //BeforeUnloadEvent is a universal listener on the window powered by the web we don't manually attach it to any component we just call it and it watches for the event.
      event.preventDefault(); //prevent page unload action
    };

    window.addEventListener("beforeunload", listener); //attach the event listener to the window

    return () => window.removeEventListener("beforeunload", listener); //cleanup, remove last event listening before a new one is attached to the window.
  }, [condition]);
}
