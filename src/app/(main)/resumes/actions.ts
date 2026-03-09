"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

export async function deleteResume(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You can't delete resume");
  }

  const resume = await prisma.resume.findUnique({
    where: { id, userId },
  });

  //if no resume with resume id or user id is found
  if (!resume) {
    throw new Error("can't find your resume");
  }

  //delete the resume image if it has one.
  if (resume.photoUrl) {
    await del(resume.photoUrl);
  }

  //then delete the resume itself
  await prisma.resume.delete({
    where: {
      id,
      userId,
    },
  });

  revalidatePath("/resumes"); //after deleting a resume, refresh the resumes page, the updated resumes list is refetch from database making sure the delete reflects immediately
}
