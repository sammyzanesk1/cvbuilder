"use server";

import { canCreateResume, canUseCustomizations } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { getUserSubscriptionLevel } from "@/lib/subscription";
import { resumeSchema, type ResumeValues } from "@/lib/validation";
import { auth } from "@clerk/nextjs/server";
import { del, put } from "@vercel/blob";
import path from "path";

/*server component...values is an object with our resumeData schema with 2 other specific overwrites viz id? and photo?..
This server component saves new resume and also uploads changes to a users existing resume*/
export async function saveResume(values: ResumeValues) {
  const { id } = values; //destructure id property  of the incoming 'values' object [resumeData], user resume ID

  /*check if the 'values' object follows the schema rules...(File, array, array, object), then destructure some specific items
  from the incoming object, the rest properties are contained in a new resumeValues object */
  const { photo, workExperiences, educations, ...resumeValues } =
    resumeSchema.parse(values);

  console.log("skills being saved:", resumeValues.skills);

  //user auth, users clerk id
  const { userId } = await auth();

  //if user is not currently logged in, action cannot happen. early return guard.
  if (!userId) {
    throw new Error("User not Authenticated");
  }

  //GUARD: If no resume ID is provided, user is attempting to create a new resume. We must verify that user subscription plan allows for additional resumes before proceeding.
  const subscriptionLevel = await getUserSubscriptionLevel(userId);

  //ensure you block user when he tries to create a new resume (a new resume has no id) in excess of the resume count his subscription plan allows by throwing an error..
  if (!id) {
    const resumeCount = await prisma.resume.count({ where: { userId } }); //get the users resume count in db

    //call canCreateResume with user subscription plan level and present resume count, canCreateResume returns true or false...
    if (!canCreateResume(subscriptionLevel, resumeCount)) {
      //user can't or is not permitted to create more resume
      throw new Error(
        "Maximum resume limit reached for this subscription level. Upgrade to the next plan to create more.",
      );
    }
  }

  // Fetch/retrieve the user's resume by id and userId. If the resume id itself does not exist in the database, or resume ID  exists but belongs to a different userId [id/userId does not match], treat it as "No Resume was found in the database" and return null.
  const existingResume = id
    ? await prisma.resume.findUnique({ where: { id, userId } })
    : null;

  console.log("received values", values, id);
  console.log("received values", values);
  console.log("values.id type:", typeof values.id, "value:", values.id);
  console.log("existingResume:", existingResume);

  //id is truthy but existingResume = null/falsy...then throw error
  if (id && !existingResume) {
    throw new Error("Resume not found");
  }

  //customization permissions based on user subscription plan level...hasCustomizations =>true if user changes style, false if new style is same as old style
  const hasCustomizations =
    (resumeValues.borderStyle &&
      resumeValues.borderStyle !== existingResume?.borderStyle) ||
    (resumeValues.colorHex &&
      resumeValues.colorHex !== existingResume?.colorHex);

  //customization only allowed if there was a customization on the cv and the user subscription plan permits it...if not throw error
  if (hasCustomizations && !canUseCustomizations(subscriptionLevel)) {
    throw new Error("customization not allowed for this subscription level");
  }

  // HANDLING THE DIFFERENT SCENARIOS FOR RESUME PHOTO BEFORE WE CAN UPDATE OR SAVE THE RESUME INTO DATABASE
  let newPhotoUrl: string | undefined | null = undefined; //define a mutable variable

  if (photo instanceof File) {
    // Case A: A PHOTO FILE IS SELECTED from DEVICE WHILE CREATING/EDITING the RESUME: we convert the selected photo from File object format into Url string using vercel blob dependency(put method)...we can't upload raw file into the database, it expect photo as a string so we use a middle man vercel blob to handle this conversion.
    //Step 1. Deletes the resume's old image file from Vercel Blob (storage), using the old URL..(we changed the photo of an existing resume in the database)
    if (existingResume?.photoUrl) {
      await del(existingResume.photoUrl);
    }

    //step 2: convert the chosen file photo (new replacement photo or new fresh photo in the case we are creating a new resume) into string url using blob put method...Uploads the new file to Vercel Blob...put stores the file and returns a blob object that includes a public URL.
    const blob = await put(`resume_photos/${path.extname(photo.name)}`, photo, {
      access: "public",
    });

    console.log(blob);

    //step 3: saves the converted blob url into a variable which will later serve as our photo url link to update the database
    newPhotoUrl = blob.url;
  } else if (photo === null) {
    //CASE B: we delete the photo from the resume without replacing it with a new one, hence the resumeData photo value will be null

    //Step 1: Delete the old existing resume photo from Vercel Blob using its URL, since the photo no longer exist as a file, remove it from blob because should no longer be stored.
    if (existingResume?.photoUrl) {
      await del(existingResume.photoUrl);
    }

    //step 2:saves null into the photo url variable indicating that this resume no longer has an associated photo when we persist changes to the database
    newPhotoUrl = null;
  }
  //if we are editing a resume already existing and retrieved from the database
  //update the resume with the latest changes
  if (id) {
    return prisma.resume.update({
      where: { id },
      data: {
        ...resumeValues, //spread the resumeValues object here,
        photoUrl: newPhotoUrl, //update photo into the database as string value...
        workExperiences: {
          deleteMany: {}, //delete old/exiting work experiences in the retrieved resume database table...next line updates the resumes with the replacement new ones
          create: workExperiences?.map((exp) => ({
            ...exp,
            startDate: exp.startDate ? new Date(exp.startDate) : undefined, //change startDate value from string to date object or undefined
            endDate: exp.endDate ? new Date(exp.endDate) : undefined,
          })),
        },
        educations: {
          deleteMany: {},
          create: educations?.map((edu) => ({
            ...edu,
            startDate: edu.startDate ? new Date(edu.startDate) : undefined,
            endDate: edu.endDate ? new Date(edu.endDate) : undefined,
          })),
        },
        updatedAt: new Date(),
      },
    });
  } else {
    //since there is no resume id, this is a first time entry of the resume data, create a new resume in the db..convert date string into date object
    return prisma.resume.create({
      data: {
        ...resumeValues,
        userId,
        photoUrl: newPhotoUrl,
        workExperiences: {
          create: workExperiences?.map((exp) => ({
            ...exp,
            startDate: exp.startDate ? new Date(exp.startDate) : undefined,
            endDate: exp.endDate ? new Date(exp.endDate) : undefined,
          })),
        },
        educations: {
          create: educations?.map((edu) => ({
            ...edu,
            startDate: edu.startDate ? new Date(edu.startDate) : undefined,
            endDate: edu.endDate ? new Date(edu.endDate) : undefined,
          })),
        },
      },
    });
  }
}
