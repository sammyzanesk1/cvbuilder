import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { EditorFormProps } from "@/lib/types";
import { skillsSchema, type SkillsValues } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

function SkillsForm({ resumeData, setResumeData }: EditorFormProps) {
  const form = useForm<SkillsValues>({
    resolver: zodResolver(skillsSchema),
    defaultValues: {
      skills: resumeData.skills || [],
    },
  });

  useEffect(() => {
    const { unsubscribe } = form.watch(async (values) => {
      const isValid = await form.trigger();

      if (!isValid) return;

      //skill !== "" => remove or filter out empty strings from the array, ?. === undefined  then || [] => if skill field is empty manually convert/fallback to empty [] instead of undefined typeerror
      setResumeData({
        ...resumeData,
        skills:
          values.skills
            ?.filter((skill) => skill !== undefined)
            .map((skill) => skill.trim())
            .filter((skill) => skill !== "") || [],
      });
    });
    //console.log(unsubscribe);
    return unsubscribe; //clean up
  }, [form, resumeData, setResumeData]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        {/* form header */}
        <h2 className="text-2xl font-semibold">Skills</h2>
        <p className="text-sm text-muted-foreground">What are you good at?</p>
      </div>

      <Form {...form}>
        <form className="space-y-3">
          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Skills</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g React, Node JS, Graphics..."
                    onChange={(e) => {
                      const skills = e.target.value.split(",");
                      field.onChange(skills); //update the skills array with the text area input, (take the string, split them, then update the field with the array)
                    }}
                  />
                </FormControl>

                <FormDescription>
                  Separate each skill with a comma(,)
                </FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
export default SkillsForm;
