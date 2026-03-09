"use client";

import { Button } from "@/components/ui/button";
import usePremiumModal from "@/hooks/usePremiumModal";
import { PlusSquare } from "lucide-react";
import Link from "next/link";

interface CreateResumeButtonProps {
  canCreate: boolean;
}

function CreateResumeButton({ canCreate }: CreateResumeButtonProps) {
  const premiumModal = usePremiumModal();

  console.log(premiumModal, canCreate, "problem");

  //show new created resume if user count is less than max cv count..ie canCreate = true
  if (canCreate) {
    return (
      <Button asChild className="mx-auto flex w-fit gap-2">
        {/* asChild makes Button component render the link as a link and not a button, check button file and its slot comment*/}
        <Link href="/editor">
          <PlusSquare className="size-5" />
          New Resume
        </Link>
      </Button>
    );
  }

  //show subscription modal if user count is not less than max cv count..ie he has created the maximum cv allowed for his sub plan, ie canCreate = false
  return (
    <Button
      onClick={() => premiumModal.setOpen(true)}
      className="mx-auto flex w-fit gap-2"
    >
      New Resume
    </Button>
  );
}
export default CreateResumeButton;
