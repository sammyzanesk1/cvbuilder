"use client";

import { Button } from "@/components/ui/button";
import usePremiumModal from "@/hooks/usePremiumModal";

function GetSubscriptionButton() {
  const premiumModal = usePremiumModal();

  return (
    <Button onClick={() => premiumModal.setOpen(true)} variant="premium">
      Get premium subscription plan activated
    </Button>
  );
}
export default GetSubscriptionButton;
