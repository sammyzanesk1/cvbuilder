import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { PopoverContent } from "@radix-ui/react-popover";
import { PaletteIcon } from "lucide-react";
import { useState } from "react";
import {
  TwitterPicker,
  type Color,
  type ColorChangeHandler,
} from "react-color";
import { useSubscriptionLevel } from "../SubscriptionLevelProvider";
import usePremiumModal from "@/hooks/usePremiumModal";
import { canUseCustomizations } from "@/lib/permissions";

//TS type defined according to react-color custom definitions since we are using react-color lib for selecting the colors
interface ColorPickerProps {
  color: Color | undefined; //color defaults to undefined at first render, TwitterPicker gives us colors to pick from when the popover is displayed [color is an object from react-color with hex, hsg as properties with actual color values, we use hex], then hexColor state is updated
  onChangeFunc: ColorChangeHandler;
}

//color picker lib x shadcn-ui popover component

function ColorPicker({ color, onChangeFunc }: ColorPickerProps) {
  const subscriptionLevel = useSubscriptionLevel();
  const premiumModal = usePremiumModal();

  /* control popover component content display..hide at first, open on click...subsequent close handled 
  under the hood through onOpenChange prop, just toggle. manual listener not needed.
  */
  const [showPopover, setShowPopover] = useState(false); //hide popover component as default
  console.log(showPopover);

  return (
    <Popover open={showPopover} onOpenChange={setShowPopover}>
      {/* trigger button to open color pallette menu*/}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="Change Resume color"
          onClick={() => {
            // SUBSCRIPTION GUARD: If the user's plan doesn't support customizations trigger the modal and block the popover from opening using the return keyword.
            if (!canUseCustomizations(subscriptionLevel)) {
              premiumModal.setOpen(true);
              return;
            }
            setShowPopover(true); // ALLOW ACCESS: Open customization options for eligible users
          }}
        >
          <PaletteIcon className="size-5" />
        </Button>
      </PopoverTrigger>

      {/* actual colors to  pick from when pallette is open after we click trigger*/}
      <PopoverContent
        className="border-none bg-transparent shadow-none"
        align="end"
      >
        <TwitterPicker
          color={color}
          onChange={onChangeFunc} //update color state with new picked color under the hood
          triangle="top-right"
        />
      </PopoverContent>
    </Popover>
  );
}
export default ColorPicker;
