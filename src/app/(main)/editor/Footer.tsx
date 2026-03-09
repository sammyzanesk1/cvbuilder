import { Button } from "@/components/ui/button";
import Link from "next/link";
import { steps } from "./steps";
import { FileUserIcon, PenLineIcon } from "lucide-react";
// import { cn } from "@/lib/utils";

interface FooterProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;

  showSmResumePreview: boolean;
  setShowSmResumePreview: (show: boolean) => void;
  isSaving: boolean;
  // hasUnsavedChanges: boolean;
}

function Footer({
  currentStep,
  setCurrentStep,
  showSmResumePreview,
  setShowSmResumePreview,
  // isSaving,
  // hasUnsavedChanges,
}: FooterProps) {
  //note currentStep is a param state variable derived from the url link, check parent component//always recollect
  // Find step index whose NEXT step index matches currentStep...ie previous step
  const previousStep = steps.find(
    (_, index) => steps[index + 1]?.key === currentStep,
  )?.key;

  /*
  Find next step index: "step whose PREVIOUS step index matches currentStep index...ie one/next step index ahead"....
  ?. => no previous before the first step, no next step after the last step returns undefined in those cases[
  */
  const nextStep = steps.find(
    (_, index) => steps[index - 1]?.key === currentStep,
  )?.key;

  console.log(steps.find((_, i) => i - 1));
  console.log(steps.find((_, i) => i + 1));

  return (
    <footer className="w-full border-t px-3 py-5">
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            disabled={!previousStep}
            onClick={
              previousStep ? () => setCurrentStep(previousStep) : undefined
            }
          >
            Previous step
          </Button>
          <Button
            disabled={!nextStep}
            onClick={nextStep ? () => setCurrentStep(nextStep) : undefined}
          >
            Next step
          </Button>
        </div>

        {/* controls how resume preview section is displayed in small screen ie button component is visible only in small screens, for small screen use a button to toggle it for large screen it is permanent*/}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSmResumePreview(!showSmResumePreview)}
          className="md:hidden" //show button only on small screen
          title={
            showSmResumePreview ? "show input form" : "show resume preview"
          }
        >
          {showSmResumePreview ? <PenLineIcon /> : <FileUserIcon />}
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="secondary" asChild>
            <Link href="/resumes">Close</Link>
          </Button>
          {/* 
          <p
            className={cn(
              "text-muted-foreground opacity-0",
              isSaving && "opacity-100",
            )}
          >
            Saving...
          </p> */}
        </div>
      </div>
    </footer>
  );
}
export default Footer;
