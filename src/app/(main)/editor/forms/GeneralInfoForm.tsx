import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EditorFormProps } from "@/lib/types";
import { generalInfoSchema, type GeneralInfoValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

function GeneralInfoForm({ resumeData, setResumeData }: EditorFormProps) {
  /*
  the form we create must have the config of the zod form schema we defined in the validation.ts file..
  we apply the rules to our form here when we create the actual form...our form resolves to the rules set 
  out in generalInfoSchema if not Zod validates on change/submit, errors shown.
  form title has to be an optional string, form description is also an optional string
  form itself is just an object returned by useForm hook which gives us access to tools we use to control actual form field element...
  forms default values are either served from resumeData state or empty strings.
  */
  const form = useForm<GeneralInfoValues>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: {
      title: resumeData.title || "",
      description: resumeData.description || "",
    },
  });

  console.log(form);

  //when form input change, form.watch runs to check for validity and emit error ie formMessage if some values are invalid...
  useEffect(() => {
    //1. Subscribe to form fields update/change without triggering re-render
    const { unsubscribe } = form.watch(async (values) => {
      const isValid = await form.trigger(); //returns false where any of our form value does not resolve to the schema rules

      //2.where invalid form data values exist don't update the form, safeguard/early return..resume is not updated with form data
      if (!isValid) return;

      //where inputted form data are all valid, update resume data state object with latest form's values ie current form data snapshot (auto-passed by form.watch)
      setResumeData({ ...resumeData, ...values });
    });

    //console.log(unsubscribe);

    return unsubscribe; //clean up
  }, [form, resumeData, setResumeData]);

  function onSubmit(data: GeneralInfoValues) {
    // Do something with the form values.
    console.log(data);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">General Info</h2>
        <p className="text-sm text-muted-foreground">
          this will not appear on your resume
        </p>
      </div>

      {/* shad cn form component */}
      <Form {...form}>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>project name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="my cool resume" autoFocus />
                </FormControl>
                <FormMessage /> {/* Displays Zod validation errors */}
              </FormItem>
            )}
          />
        </form>
      </Form>
      <Form {...form}>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>project description</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Resume for job placement" />
                </FormControl>
                <FormDescription>
                  Describe what this resume is for...
                </FormDescription>
                <FormMessage /> {/* Displays Zod validation errors */}
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
export default GeneralInfoForm;
