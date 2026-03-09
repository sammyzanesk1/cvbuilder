import { Button } from "@/components/ui/button";
import { Circle, Square, Squircle } from "lucide-react";
import { useSubscriptionLevel } from "../SubscriptionLevelProvider";
import usePremiumModal from "@/hooks/usePremiumModal";
import { canUseCustomizations } from "@/lib/permissions";

//borderStyle object
export const BorderStyle = {
  SQUARE: "square",
  CIRCLE: "circle",
  SQUIRCLE: "squircle",
};

// Convert BorderStyle object values into an array for juggling between border styles
const borderStyles = Object.values(BorderStyle);
console.log(borderStyles);

//type definition for BorderStylesButton component props
interface BorderStylesButtonProps {
  borderStyle: string | undefined;
  onChangeFunc: (borderStyle: string) => void;
}

function BorderStylesButton({
  borderStyle,
  onChangeFunc,
}: BorderStylesButtonProps) {
  const subscriptionLevel = useSubscriptionLevel();
  const premiumModal = usePremiumModal();

  function handleClick() {
    //BORDER STYLE GUARD: Prevent border changes if the user's plan doesn't support it...Early return keyword ensures the custom style is never applied. the func stops running
    if (!canUseCustomizations(subscriptionLevel)) {
      premiumModal.setOpen(true);
      return;
    }

    const currentIndex = borderStyle
      ? borderStyles.indexOf(borderStyle)
      : borderStyles.indexOf(BorderStyle.SQUIRCLE); // Get index of current borderStyle; if undefined, default to SQUIRCLE

    // Move to the next index and wrap to 0 at the end (cyclic toggle using modulus: for last index (n−1), (n−1+1)%n = 0 so it goes back to the first element).
    const nextIndex = (currentIndex + 1) % borderStyles.length;

    //set the border style state to the next element in the array
    onChangeFunc(borderStyles[nextIndex]);
  }

  //the border style component to be rendered depend on the border state
  const Icon =
    borderStyle === "square"
      ? Square
      : borderStyle === "circle"
        ? Circle
        : Squircle;

  return (
    <Button
      variant="outline"
      size="icon"
      title="Change border style"
      onClick={handleClick}
    >
      <Icon className="size-5" />
    </Button>
  );
}
export default BorderStylesButton;
