import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useDebounce from "@/hooks/useDebounce";
import { fileReplacer } from "@/lib/utils";
import type { ResumeValues } from "@/lib/validation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { saveResume } from "./action";

// Custom hook for autosaving the resume: compares debounced resumeData to the last saved snapshot [cloned resumeData] and updates saving UI state when there are changes.
export default function useAutoSaveResume(resumeData: ResumeValues) {
  //
  const searchParams = useSearchParams(); //copy the url param

  const { toast } = useToast();

  const debouncedResumeData = useDebounce(resumeData, 1500); //updated debounced resume data

  const [resumeId, setResumeId] = useState(resumeData.id);

  // console.log(resumeId);

  //creates a deep clone of the resumeData object...useState only uses structuredClone(resumeData) once, on the first/initial render so lastSavedData will not always be in sync with resumeData, only on first render
  const [lastSavedData, setLastSavedData] = useState(
    structuredClone(resumeData),
  );

  const [isSaving, setIsSaving] = useState(false); //saving state for debounced data

  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsError(false);
  }, [debouncedResumeData]);

  useEffect(() => {
    async function save() {
      try {
        setIsSaving(true);
        setIsError(false);

        const newData = structuredClone(debouncedResumeData); //deep clone of debounced data

        const updatedResume = await saveResume({
          ...newData,
          ...(JSON.stringify(lastSavedData.photo, fileReplacer) ===
            JSON.stringify(newData.photo, fileReplacer) && {
            photo: undefined, //photo was not changed...so don't upload the same photo again to the back end
          }),
          id: resumeId,
        });

        setResumeId(updatedResume.id); //database assigns an id to created resume, update resume id manually
        setLastSavedData(newData); //update lastSavedData to debouncedData

        // console.log(
        //   updatedResume.id,
        //   searchParams.get("resumeId") !== updatedResume.id,
        // );

        //once we update a resume, attach its id to the url...works when we create a new resume for the first time.it has no id, as we edit it an id is created by the db, we attach this id immediately to the url
        if (searchParams.get("resumeId") !== updatedResume.id) {
          const newSearchParams = new URLSearchParams(searchParams); //copy current url

          newSearchParams.set("resumeId", updatedResume.id); //set current url's param resumeId value to the updatedResume.id

          window.history.replaceState(
            null,
            "",
            `?${newSearchParams.toString()}`,
          );
        }
      } catch (error) {
        setIsError(true);
        console.error(error);

        const { dismiss } = toast({
          variant: "destructive",
          description: (
            <div className="space-y-3">
              <p>Could not Save changes...</p>
              <Button
                variant="secondary"
                onClick={() => {
                  dismiss();
                  save();
                }}
              >
                Retry
              </Button>
            </div>
          ),
        });
      } finally {
        setIsSaving(false);
      }
    }
    console.log(
      "debouncedResumeData",
      JSON.stringify(debouncedResumeData, fileReplacer),
    );
    console.log("lastSavedData", JSON.stringify(lastSavedData, fileReplacer));

    //checks whether clone of resumeData on last render is different from the latest debounced ResumeData...if so there are unsaved changes to the resumeData
    const hasUnsavedChanges =
      JSON.stringify(debouncedResumeData, fileReplacer) !==
      JSON.stringify(lastSavedData, fileReplacer);

    //effect debounced changes if no saving is on, there is a debounced value and the debounced resumeData is different from resumeData clone it there are unsaved changes
    if (hasUnsavedChanges && debouncedResumeData && !isSaving && !isError) {
      save();
    }
  }, [
    debouncedResumeData,
    isSaving,
    lastSavedData,
    isError,
    resumeId,
    searchParams,
    toast,
  ]); //only update the cloned resumeData object when a user actually changes input values ie when debounceResumeData returns...

  return {
    isSaving,
    hasUnsavedChanges:
      JSON.stringify(resumeData) !== JSON.stringify(lastSavedData), //compare the two data objects easily by making them string
  };
}
