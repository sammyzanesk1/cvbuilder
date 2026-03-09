import { SignIn } from "@clerk/nextjs";

const Page = () => {
  return (
    <main className="flex h-screen items-center justify-center">
      <SignIn />
    </main>
  );
};
export default Page;
