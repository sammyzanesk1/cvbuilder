import { SignUp } from "@clerk/nextjs";

const page = () => {
  return (
    <main className="flex h-screen items-center justify-center">
      <SignUp />
    </main>
  );
};
export default page;
