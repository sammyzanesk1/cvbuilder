import ResumePreview from "@/components/ResumePreview";
import type { ResumeValues } from "@/lib/validation";
import ColorPicker from "./ColorPicker";
import BorderStylesButton from "./BorderStylesButton";
import { cn } from "@/lib/utils";

interface ResumePreviewSectionProps {
  resumeData: ResumeValues;
  setResumeData: (data: ResumeValues) => void;

  className?: string;
}

function ResumePreviewSection({
  resumeData,
  setResumeData,
  className,
}: ResumePreviewSectionProps) {
  //
  console.log(resumeData.colorHex);
  console.log(resumeData.borderStyle);

  return (
    // small screen width is full
    <div
      className={cn("group relative hidden w-full md:flex md:w-1/2", className)} //incoming className prop with flex value overwrites the hidden class here to make section visible, this is how the toggling between editor and preview sections work
    >
      <div className="absolute left-1 top-1 flex flex-none flex-col gap-3 opacity-40 transition-opacity group-hover:opacity-100 lg:left-3 lg:top-3 xl:opacity-100">
        {/* [ci.a] */}
        <ColorPicker
          color={resumeData.colorHex} //colorHex undefined initially
          onChangeFunc={(color) =>
            //update state when child component changes color state...color.hex (from react-color) → goes into resumeData.colorHex
            setResumeData({ ...resumeData, colorHex: color.hex })
          }
        />

        {/* [ci.b] profile photo border radius changer */}
        <BorderStylesButton
          borderStyle={resumeData.borderStyle}
          onChangeFunc={(borderStyle) =>
            //update the border style property when it is changed by user action in the child component
            setResumeData({ ...resumeData, borderStyle })
          }
        />
      </div>
      <div className="flex w-full justify-center overflow-y-auto bg-red-200 bg-secondary text-[3vw]">
        {/* [c.ii] */}
        <ResumePreview
          resumeData={resumeData}
          className="max-w-2xl shadow-md"
        />
      </div>
    </div>
  );
}
export default ResumePreviewSection;
