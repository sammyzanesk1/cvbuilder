import { useEffect, useState } from "react";

//Hook: track responsive width/height for the resume preview container. Given a ref to a <div>, returns its latest { width, height } using ResizeObserver.

export default function useDimensions(
  containerRef: React.RefObject<HTMLDivElement>,
) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 }); //state for the referenced div elements's height and width

  //fires whenever the size of the referenced div element changes
  useEffect(() => {
    const currentRef = containerRef.current; // Snapshot the current DOM element from the ref when this effect runs into a variable called currentRef

    //gets the present width and height of the currentRef variable, if currentRef is null(not in dom yet) set default to 0s..recall when refs are null(no dom nodes yet, hot reload etc)
    function getDimensions() {
      return {
        width: currentRef?.offsetWidth || 0,
        height: currentRef?.offsetHeight || 0,
      };
    }

    /*
    entries = array of ResizeObserverEntry objects passed by the browser
    each entry describes a resize event for an observed element
    take the first resize event for our element..note the browser automatically watches for changes in the referenced element by itself
    */
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      // if there is a resize entry the browser detects automatically that the element's size changed → read fresh width/height and update state
      if (entry) {
        setDimensions(getDimensions());
      }
    });

    //once referenced element is not null, present in the dom, attach the ResizeObserver to it -start observing -it and record its initial height and width then update state with that info...sets up the observer first time”
    if (currentRef) {
      resizeObserver.observe(currentRef);
      setDimensions(getDimensions());
    }

    //clean up function to kill of the side effect when the component unmounts...both for the observer function and the resizeobserver function
    return () => {
      if (currentRef) {
        resizeObserver.unobserve(currentRef);
      }

      resizeObserver.disconnect();
    };
  }, [containerRef]); //dependency array fire the watch state, once contain ref exist activate the hook

  return dimensions; //return final width and height so we can use to determine our font sizing in resume preview component
}
