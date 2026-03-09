import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal("")); //the filed is a string value, removes trailing spaces, the user could leave this field empty|undefined or with just string "", its an optional field

//form 1 general info form schema
//the rules our forms we will create have to follow..the schema or skeleton of our intended form..
export const generalInfoSchema = z.object({
  title: optionalString,
  description: optionalString,
});

export type GeneralInfoValues = z.infer<typeof generalInfoSchema>; //type definition infer/copies object

//form 2 personal info form schema
// Optional image file: no file = no error, must be image/* type if provided...undefined OR (File && image && <4MB)
export const personalInfoSchema = z.object({
  photo: z
    .custom<File | undefined>()
    .refine(
      (file) =>
        !file || (file instanceof File && file.type.startsWith("image/")),
      "Must be an Image file",
    )
    .refine(
      (file) => !file || file.size <= 1024 * 1024 * 4,
      "File must be less than 4MB",
    ),
  firstName: optionalString,
  lastName: optionalString,
  jobTitle: optionalString,
  city: optionalString,
  country: optionalString,
  phone: optionalString,
  email: optionalString,
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>; //type definition infer/copies object

//form 3, work experience form schema, work experience can be more than one, so its schema is in an array of work experience objects form, array of different work experiences objects with the same form fields/inputs rule for all
export const workExperienceSchema = z.object({
  workExperiences: z
    .array(
      z.object({
        position: optionalString,
        company: optionalString,
        startDate: optionalString,
        endDate: optionalString,
        description: optionalString,
      }),
    )
    .optional(),
});
export type WorkExperienceValues = z.infer<typeof workExperienceSchema>; //type definition infer/copies workExperience schema

//form 4 education info form schema
export const educationSchema = z.object({
  educations: z
    .array(
      z.object({
        degree: optionalString,
        school: optionalString,
        startDate: optionalString,
        endDate: optionalString,
      }),
    )
    .optional(),
});

export type EducationValues = z.infer<typeof educationSchema>;

//form 5, skill info schema...just an array of skills entries as string...deletes white spaces
export const skillsSchema = z.object({
  skills: z.array(z.string().trim()).optional(),
});

export type SkillsValues = z.infer<typeof skillsSchema>;

//schema 6 Summary string
export const summarySchema = z.object({
  summary: optionalString,
});

export type SummaryValues = z.infer<typeof summarySchema>;

//type definition schema for storing resumeData, note the resume data is obtained from filling in the above forms, so just merge the schemas to get resumeDataSchema using spread operator..initially the resumeData will be an empty object since every property is optional and not set at runtime, we only populate it based on user action
export const resumeSchema = z.object({
  ...generalInfoSchema.shape,
  ...personalInfoSchema.shape,
  ...workExperienceSchema.shape,
  ...educationSchema.shape,
  ...skillsSchema.shape,
  ...summarySchema.shape,
  colorHex: optionalString,
  borderStyle: optionalString,
});

//resume data values should be the same as the resumeSchema which is the same with the root schemas merged, however add some overwrites
export type ResumeValues = Omit<z.infer<typeof resumeSchema>, "photo"> & {
  id?: string; //assign an optional id field after we have created the resume successfully
  photo?: File | string | null; //our photo type for the resume is different(url string returned from database or null when we delete a resumes photo) from the photo type in the form(file uploaded to the database), omit the form photo rule, set new rule here.
};
