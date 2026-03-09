import useDimensions from "@/hooks/useDimensions";
import { cn } from "@/lib/utils";
import type { ResumeValues } from "@/lib/validation";
import { formatDate } from "date-fns";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { BorderStyle } from "@/app/(main)/editor/BorderStylesButton";

interface ResumePreviewProps {
  resumeData: ResumeValues;
  contentRef?: React.Ref<HTMLDivElement>;
  className?: string;
}

//resume preview component renders the forms ui
function ResumePreview({
  resumeData,
  contentRef,
  className,
}: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null); //type definition for the referenced element,

  const { width } = useDimensions(containerRef); //invoke the hook which calculates width using the resume preview div element reference, the hook returns an object with height and width properties, extract width

  return (
    <div
      className={cn("aspect-[210/297] h-fit w-full text-black", className)}
      ref={containerRef}
    >
      <div
        ref={contentRef}
        id="resumePreviewContent"
        style={{ zoom: (1 / 794) * width }} // scale entire content in proportion to the div's current width
        className={cn("space-y-6 p-6", !width && "invisible")} //if width = 0, hide content
      >
        {/* raw resumeData */}
        {/* <pre>{JSON.stringify(resumeData, null, 2)}</pre> */}
        {/* the below components are rendered/displayed but empty because no form inputs have been being filled at run time */}
        <PersonalInfoHeader resumeData={resumeData} />
        <SummarySection resumeData={resumeData} />
        <WorkExperienceSection resumeData={resumeData} />
        <EducationSection resumeData={resumeData} />
        <SkillsSection resumeData={resumeData} />
      </div>
    </div>
  );
}
export default ResumePreview;

//component to display personal info details
interface ResumeSectionProps {
  resumeData: ResumeValues;
}

function PersonalInfoHeader({ resumeData }: ResumeSectionProps) {
  const {
    photo,
    firstName,
    lastName,
    jobTitle,
    city,
    country,
    phone,
    email,
    colorHex,
    borderStyle,
  } = resumeData; //destructure personal info details from the entire resume details

  const [photoSrc, setPhotoSrc] = useState(photo instanceof File ? "" : photo); //photo can either be string (photo retrieved from database as url) or instance of file (when we choose as file) in this case default it to string

  useEffect(() => {
    /*
    1). specifically handle the case where photo is file instance, we convert it to a string url
    2). photo file -> string...note createObjectURL creates memory leaks between render hence we use useEffect.
    3). update the photo state with the converted string from photo object
    4). handle when we delete a photo...deletion returns null hence photo will be cleared or "";
    5). to avoid memory leaks from URL.createObjectURL. Cleanup: when photo changes or component unmounts, revoke the previous blob URL
    */
    const objectUrl = photo instanceof File ? URL.createObjectURL(photo) : ""; //1. & 2.

    if (objectUrl) setPhotoSrc(objectUrl); //3.

    if (photo === null) setPhotoSrc(""); //4.

    return () => URL.revokeObjectURL(objectUrl); //5.
  }, [photo]);

  return (
    <div className="flex items-center gap-6">
      {photoSrc && (
        <Image
          alt="author-photo"
          src={photoSrc}
          height={100}
          width={100}
          className="aspect-square object-cover"
          style={{
            borderRadius:
              borderStyle === BorderStyle.SQUARE
                ? "0px"
                : borderStyle === BorderStyle.CIRCLE
                  ? "9999px"
                  : "10%", ////default border style when borderStyle is undefined[initial render] and not SQUARE && CIRCLE
          }}
        />
      )}

      <div className="space-y-2.5">
        <div className="space-y-1">
          <p className="text-3xl font-bold" style={{ color: colorHex }}>
            {firstName} {lastName}
          </p>
          <p className="font-serif text-sm" style={{ color: colorHex }}>
            {jobTitle}
          </p>
        </div>
        <p className="text-xs">
          {city}
          {city && country ? ", " : ""}
          {country}
          {(city || country) && (phone || email) ? "  •  " : ""}
          {[phone, email].filter(Boolean).join("  •  ")}
        </p>
      </div>
    </div>
  );
}

function SummarySection({ resumeData }: ResumeSectionProps) {
  const { summary, colorHex } = resumeData;

  if (!summary) return null;

  return (
    <>
      <hr className="border-2" style={{ borderColor: colorHex }} />
      <div className="break-inside-avoid space-y-3">
        <p
          className="font-serif text-lg font-semibold"
          style={{ color: colorHex }}
        >
          Professional Profile
        </p>
        <div className="whitespace-pre-line text-sm">{summary}</div>
      </div>
    </>
  );
}

function WorkExperienceSection({ resumeData }: ResumeSectionProps) {
  const { workExperiences, colorHex } = resumeData; // Destructure workExperience array from resumeData. workExperience is an array of job entries: [{...}, {...}, ...].

  /*
  For each experience object in workExperience array, take its field values as an array (Object.values(exp)), filter that values array to only truthy entries (empty "" defaults are falsy),
  and keep the object only if that values array still has at least one truthy item; if no objects have any truthy fields, the filtered array/worExperienceNotEmpty is empty and nothing is rendered (?.)
  */

  const worExperienceNotEmpty = workExperiences?.filter(
    (exp) => Object.values(exp).filter(Boolean).length > 0,
  );

  // console.log(workExperiences);
  // console.log(worExperienceNotEmpty);

  //early return when users update empty work experience form ie the array contains empty objects...worExperienceNotEmpty is empty
  if (!worExperienceNotEmpty?.length) return null;

  return (
    <>
      <hr className="border-2" style={{ borderColor: colorHex }} />
      <div className="space-y-3">
        <p
          className="font-serif text-lg font-semibold"
          style={{ color: colorHex }}
        >
          Work Experience
        </p>
        {worExperienceNotEmpty.map((exp, index) => (
          <div key={index} className="break-inside-avoid space-y-1">
            <div
              className="flex items-center justify-between text-sm font-semibold"
              style={{ color: colorHex }}
            >
              <span>{exp.position}</span>

              {/* render date conditionally if startDate is chosen*/}
              {exp.startDate && (
                <span>
                  {formatDate(exp.startDate, "MM/yyyy")} -{" "}
                  {exp.endDate ? formatDate(exp.endDate, "MM/yyyy") : "present"}
                </span>
              )}
            </div>

            {/* render description */}
            <p className="text-xs font-semibold">{exp.company}</p>
            <div className="whitespace-pre-line text-sm">{exp.description}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function EducationSection({ resumeData }: ResumeSectionProps) {
  const { educations, colorHex } = resumeData;
  // console.log(educations);

  const educationsNotEmpty = educations?.filter(
    (edu) => Object.values(edu).filter(Boolean).length > 0,
  );
  if (!educationsNotEmpty?.length) return null;

  return (
    <>
      <hr className="border-2" style={{ borderColor: colorHex }} />
      <div className="space-y-3">
        <p
          className="font-serif text-lg font-semibold"
          style={{ color: colorHex }}
        >
          Education Details
        </p>
        {educationsNotEmpty.map((edu, index) => (
          <div key={index} className="break-inside-avoid space-y-1">
            <div
              className="flex items-center justify-between text-sm font-semibold"
              style={{ color: colorHex }}
            >
              <span>{edu.degree}</span>

              {/* render date conditionally if startDate is chosen*/}
              {edu.startDate && (
                <span>
                  {edu.startDate &&
                    `${formatDate(edu.startDate, "MM/yyyy")}
                  ${edu.endDate ? `-${formatDate(edu.endDate, "MM/yyyy")}` : ""}`}
                </span>
              )}
            </div>

            {/* render school */}
            <p className="text-xs font-semibold">{edu.school}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function SkillsSection({ resumeData }: ResumePreviewProps) {
  const { skills, colorHex, borderStyle } = resumeData;
  // console.log(skills, typeof skills, Array.isArray(skills));

  /*
  Guard clause: if users leaves the skills field untouched, no entries into it at all, skills will be undefined->undefined->falsy->! negates to true, 
  if users fills and deletes / empties the skills field, skills becomes an empty array - its length -> 0 -> falsy value -> condition holds true, return null early
  */

  if (!skills?.length) return null;
  // console.log(skills, typeof skills, Array.isArray(skills));

  return (
    <>
      <hr className="border-2" style={{ borderColor: colorHex }} />
      <div className="break-inside-avoid space-y-3">
        <p
          className="font-serif text-lg font-semibold"
          style={{ color: colorHex }}
        >
          Skills
        </p>
        <div className="flex break-inside-avoid flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge
              key={index}
              className={`${borderStyle === BorderStyle.CIRCLE ? "px-2" : ""} rounded-md bg-black text-white hover:bg-black`}
              style={{
                backgroundColor: colorHex,
                borderRadius:
                  borderStyle === BorderStyle.SQUARE
                    ? "0px"
                    : borderStyle === BorderStyle.CIRCLE
                      ? "9999px"
                      : "8px", //default border style when borderStyle is undefined and not SQUARE && CIRCLE
              }}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}
