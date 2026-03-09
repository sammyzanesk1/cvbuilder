"use client";

import useUnloadWarning from "@/hooks/useUnloadWarning";
import type { ResumeServerData } from "@/lib/types";
import { cn, mapToResumeValues } from "@/lib/utils";
import type { ResumeValues } from "@/lib/validation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Breadcrumbs from "./Breadcrumbs";
import Footer from "./Footer";
import ResumePreviewSection from "./ResumePreviewSection";
import { steps } from "./steps";
import useAutoSaveResume from "./useAutoSaveResume";

interface ResumeEditorProps {
  resumeToEdit: ResumeServerData | null;
}

function ResumeEditor({ resumeToEdit }: ResumeEditorProps) {
  //access search param
  const searchParams = useSearchParams();
  // console.log(searchParams);

  //object state that stores the different form field data, has zod validation schema and type rules...the state is shared by, updated by and passed to varying form components as prop for easy data update and access
  const [resumeData, setResumeData] = useState<ResumeValues>(
    resumeToEdit ? mapToResumeValues(resumeToEdit) : {},
  );

  console.log(resumeData); //both general form and personal form and the other forms all update their distinct data into this one big object state...

  //boolean state that controls which component will be displayed on small screens based on css tied to it
  const [showSmResumePreview, setShowSmResumePreview] =
    useState<boolean>(false);
  console.log(showSmResumePreview);

  const { isSaving, hasUnsavedChanges } = useAutoSaveResume(resumeData);

  useUnloadWarning(hasUnsavedChanges);

  // Get the current "step" param value from the URL; if missing, use default step key...it changes dynamically based omn whats in the url i.e param state
  const currentStep = searchParams.get("step") || steps[0].key;

  // Update the "step" param in the URL without losing other params
  function setStep(key: string) {
    // console.log(key);
    const newSearchParams = new URLSearchParams(searchParams); // Make a copy of the current search params to safely modify them

    newSearchParams.set("step", key); // Set/overwrite the "step" param to the param key value

    window.history.pushState(null, "", `?${newSearchParams.toString()}`); // Update browser's URL with the new search params (without reloading)...useSearchParams() detects change → triggers rerender of this component and the new bread crumb is also rerender as a child
  }

  //which form component to render on the editor page, default to steps[0].component, else the component of the current selected breadcrumbs step is rendered ie steps[currentStep].component
  const FormComponent = steps.find(
    (step) => step.key === currentStep,
  )?.component;

  /*
    Initial load: No ?step → currentStep = steps[0].key ("general-info")
    Breadcrumbs: "general-info" highlighted as active  
    User clicks "personal-info" → setStep() fires
    Copy URL → set step=personal-info → pushState() → URL updates
    useSearchParams() detects → re-render → new FormComponent
    Breadcrumbs re-renders (child) → "personal-info" now active
  */

  return (
    // editor header [a]
    <div className="flex grow flex-col">
      <header className="space-y-1.5 border-b px-3 py-5 text-center">
        {/* resume editor header */}
        <h1 className="text-2xl font-bold">Design your Resume</h1>
        <p className="text-sm text-muted-foreground">
          Follow the steps below to create your resume. Your progress will be
          saved automatically
        </p>
      </header>

      {/* [b]...main content area - where you build the resume using forms [left side of editor page] and live update your resume content [right side]*/}
      <main className="relative grow">
        <div className="absolute bottom-0 top-0 flex w-full">
          <div
            className={cn(
              "w-full space-y-6 overflow-y-auto p-3 md:block md:w-1/2",
              showSmResumePreview && "hidden", //hide editor when showSmResumePreview is true/toggled on, at default it is false so editor page is not hidden and displayed first
            )}
          >
            {/* [bi]....left side of editor page, where the forms are filled and resume is built */}
            <Breadcrumbs currentStep={currentStep} setCurrentStep={setStep} />
            {/* Safe render: FormComponent(s) may be undefined if currentStep doesn't match any step.key..in that case no component is rendered, potential error handled...*/}
            {FormComponent && (
              //[bii]
              <FormComponent
                resumeData={resumeData}
                setResumeData={setResumeData}
              />
            )}
          </div>
          {/*[c..] *resume live content update area / resume preview section [right side of editor page]*/}
          <div className="grow md:border-r" />

          <ResumePreviewSection
            resumeData={resumeData}
            setResumeData={setResumeData}
            className={cn(showSmResumePreview && "flex")} // means if showSmResumePreview is truthy pass className "flex" else don't pass anything as prop: "", cn ignores falsy..conditionally passes the flex classname value as prop
          />
        </div>
      </main>

      {/* resume editor footer */}
      <Footer
        currentStep={currentStep}
        setCurrentStep={setStep}
        setShowSmResumePreview={setShowSmResumePreview}
        showSmResumePreview={showSmResumePreview}
        isSaving={isSaving}
        // hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  );
}
export default ResumeEditor;
