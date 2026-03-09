import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EditorFormProps } from "@/lib/types";
import { personalInfoSchema, type PersonalInfoValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

//props type definition => EditorFormProps...

function PersonalInfoForm({ resumeData, setResumeData }: EditorFormProps) {
  /*
  //photo rule in the schema is undefined | file, ab initio the form's field value is undefined, no need to set default value here..set for optional strings to make them controlled inputs ab initio ie prevent undefined error
  //form fields are empty initially, once filled data is saved in resumeData state in parent component passed in as prop
  */
  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: resumeData.firstName || "",
      lastName: resumeData.lastName || "",
      jobTitle: resumeData.jobTitle || "",
      city: resumeData.city || "",
      country: resumeData.country || "",
      phone: resumeData.phone || "",
      email: resumeData.email || "",
    },
  });

  //when form input change, form.watch runs to check for validity or emit error ie formMessage
  useEffect(() => {
    //1. Subscribe to form fields update/change without triggering re-render
    const { unsubscribe } = form.watch(async (values) => {
      const isValid = await form.trigger(); //returns false where any of our form value does not resolve to the schema rules

      //2. where inputted form data are all valid, update resume data state object with latest form's values ie current form data snapshot (auto-passed by form.watch)

      if (!isValid) return;

      //where inputted form data are all valid, update resume data state object with latest form's values ie current form data snapshot (auto-passed by form.watch)
      setResumeData({ ...resumeData, ...values });
    });
    //console.log(unsubscribe);
    return unsubscribe; //clean up
  }, [form, resumeData, setResumeData]);

  //delete photo functionality
  const photoInputRef = useRef<HTMLInputElement>(null); //assigns a reference to the input element

  return (
    <div className="ma-w-xl mx-auto space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold">Personal Info</h2>
        <p className="text-sm text-muted-foreground"> Tell Us about yourself</p>
      </div>

      {/* form component */}
      <Form {...form}>
        <form className="space-y-3">
          <FormField
            control={form.control} // Connects field to form state
            name="photo" // Matches schema field name
            render={(
              { field: { value, ...fieldValues } }, // field = {value ie inputted value, onChange, onBlur, ref}
            ) => (
              <FormItem>
                <FormLabel>Your resume photo</FormLabel>

                <div className="flex items-center gap-2">
                  <FormControl>
                    {/* image input field */}
                    <Input
                      {...fieldValues} // Spreads onChange, onBlur, ref
                      type="file"
                      ref={photoInputRef}
                      accept="image/*" // Only allow image file to be selected from file folder by the user
                      onChange={(e) => {
                        // Custom file handler
                        const file = e.target.files?.[0]; // Get selected file
                        fieldValues.onChange(file); // Update form state → triggers Zod
                        console.log(file);
                      }}
                    />
                  </FormControl>

                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      fieldValues.onChange(null); //update the react hook form photo input field state to null -> makes resumeData.photo = null..
                      if (photoInputRef.current) {
                        photoInputRef.current.value = ""; // Clear the file input field so it no longer holds the previously selected file url
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
                {/* Key: `fieldValues.onChange(file)` **tells form "photo = this file"** → Zod validates through useEffect 
                since a form import / file has change→ `<FormMessage />` shows error! Shows configured schema Zod errors : "Must be an Image file"*/}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your first name</FormLabel>
                  <FormControl>
                    {/* first name inout field */}
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your last name</FormLabel>
                  <FormControl>
                    {/* last name input field */}
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
export default PersonalInfoForm;
