import type { Prisma } from "@prisma/client";
import type { ResumeValues } from "./validation";

//type definition for the different editor forms component props, no need duplicating interfacing for each form component just centralize and export them here
export interface EditorFormProps {
  resumeData: ResumeValues;
  setResumeData: (data: ResumeValues) => void;
}

export const resumeDataInclude = {
  workExperiences: true,
  educations: true,
} satisfies Prisma.ResumeInclude;

//generate resume type which merges both both the normal resumeData properties and includes the resumeDataInclude object
export type ResumeServerData = Prisma.ResumeGetPayload<{
  include: typeof resumeDataInclude;
}>;
