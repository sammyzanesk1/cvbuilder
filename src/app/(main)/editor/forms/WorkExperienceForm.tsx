import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EditorFormProps } from "@/lib/types";
import {
  workExperienceSchema,
  type WorkExperienceValues,
} from "@/lib/validation";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripHorizontal } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

function WorkExperienceForm({ resumeData, setResumeData }: EditorFormProps) {
  //creating the work experience form using rhf custom useForm hook
  const form = useForm<WorkExperienceValues>({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: {
      workExperiences: resumeData.workExperiences || [],
    },
  });

  /*when form input change, form.watch runs to check for validity or emit error ie formMessage...
  React HF form.watch() returns undefined for untouched arrays(work experience form data is stored in an array,  defaultValue = []) so user skipping Work Experience form would leave
  the workExperience form data as empty array and undefined is returned by RHF instead of empty array - we convert that undefined back to empty array manually then safely update resumeData state if not undefined would crash state updates
  Array with content → Passes through
  Empty array (filled then deleted hence empty) → Passes through  
  not filled,array not touched at all => Undefined..return empty array manually by optional chaining, undefined return [].
  */
  useEffect(() => {
    //1. Subscribe to form fields update/change without triggering re-render
    const { unsubscribe } = form.watch(async (values) => {
      const isValid = await form.trigger(); //returns false where any of our form value does not resolve to the schema rules

      //2. where inputted form data are all valid, update resume data state object with latest form's values ie current form data snapshot (auto-passed by form.watch)
      if (!isValid) return;

      /*where inputted form data are all valid, update resume data state object with latest form's values ie current form data snapshot (auto-passed by form.watch)
      RHF watch(): untouched arrays = undefined (not default []), convert → [] for safe resumeData stat*/
      setResumeData({
        ...resumeData,
        workExperiences:
          values.workExperiences?.filter((exp) => exp !== undefined) || [], // condition only runs when user fills an experience and watch passes an array as values.workExperience, no experience just return empty array safely
      });
    });
    //console.log(unsubscribe);
    return unsubscribe; //clean up
  }, [form, resumeData, setResumeData]);

  /*form field data manipulation functionality => we can fill in multiple work experience into the array and delete some, reorder the items in the array etc. 
  useFieldArray turns your workExperiences: [] into a dynamic, manipulable array with some out of the box functions*/
  // console.log(form)
  const { fields, append, remove, move } = useFieldArray({
    control: form.control, //hand over form control to useFieldArray hook
    name: "workExperiences",
  });

  //reordering and dragging functionality
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event; //active is d dragged item, over is the item you displaced with the dragged item

    //dragging and dropping works only when 2 items are changing position.. Only reorder when we drop over a valid target AND it's a different item
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id); //loop through the fields array (array of experience objects) and return the index of the object whose id matches the dragged item (active.id)
      const newIndex = fields.findIndex((field) => field.id === over.id); // loop through the fields array (array of experience objects) and return the index of the object whose id matches the drop target item/dragged over item (over.id)
      move(oldIndex, newIndex); //swap the position of the dragged item and the dispositioned item in react hook form...allow react hook form recognize and implement the change in the fields array
      return arrayMove(fields, oldIndex, newIndex); //return the new positions of all items on the list... tell react-hook-form to reorder the field array: move dragged item from oldIndex → newIndex
    }
  }

  console.log(fields);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1.5 text-center">
        {/* form header */}
        <h2 className="text-2xl font-semibold">Work Experience</h2>
        <p className="text-sm text-muted-foreground">
          Add as many Work Experiences as you like
        </p>
      </div>
      {/* rendering the work experience form, field.id is generated by rhf */}
      <Form {...form}>
        <form className="space-y-3">
          <DndContext // provides drag and drop func to work experience items..ie all fields items
            sensors={sensors} //how drg is detected, already defined in sensors variable
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd} //execute sorting logic
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext //defines its children will be sortable...fields array items[workExperience]
              items={fields} //array items to be sorted
              strategy={verticalListSortingStrategy} //up and down sorting only
            >
              {fields.map((field, index) => (
                <WorkExperienceItem
                  id={field.id}
                  key={field.id}
                  index={index}
                  form={form}
                  remove={remove}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() =>
                append({
                  position: "",
                  company: "",
                  startDate: "",
                  endDate: "",
                  description: "",
                })
              }
            >
              Add Work Experience
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
export default WorkExperienceForm;

interface WorkExperienceItemProps {
  form: UseFormReturn<WorkExperienceValues>;
  index: number;
  id: string; //id for each field/work experience item or work experience object generated by react hook form...
  remove: (index: number) => void;
}

function WorkExperienceItem({
  id,
  form,
  index,
  remove,
}: WorkExperienceItemProps) {
  //configure each field item to enable the drag and drop sorting functionality...
  const {
    attributes,
    listeners, //the specific element which trigger drag and drop..the event element
    setNodeRef, //the div whose items are sortable
    transform, //css
    transition, //css
    isDragging, //state for active/current dragging
  } = useSortable({ id });
  return (
    <div
      className={cn(
        "space-y-3 rounded-md border bg-background p-3",
        isDragging && "relative z-50 cursor-grab shadow-xl", //apply shadow and visibility to the currently dragged field element
      )}
      ref={setNodeRef} //drag and drop is enabled in this entire div, items within this div are sortable
      style={{ transform: CSS.Transform.toString(transform), transition }} //css animate items while dragging them to visual effects
    >
      <div className="flex justify-between gap-2">
        <span className="">work experience {index + 1}</span>
        <GripHorizontal
          className="size-5 cursor-grab text-muted-foreground focus:outline-none"
          {...attributes}
          {...listeners} //attach drag and drop event specifically only to this element
        />
      </div>
      <FormField
        control={form.control}
        name={`workExperiences.${index}.position`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Job Title</FormLabel>
            <FormControl>
              <Input {...field} autoFocus />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`workExperiences.${index}.company`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name={`workExperiences.${index}.startDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  value={field.value?.slice(0, 10)} //only render the date without the minute and seconds timestamp in the form field
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`workExperiences.${index}.endDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  value={field.value?.slice(0, 10)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <FormDescription>
        Leave <span className="font-semibold">end date</span> empty if you are
        currently employed
      </FormDescription>
      <FormField
        control={form.control}
        name={`workExperiences.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Job Description</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* delete functional for the work experience forms using index of the form*/}
      <Button variant="destructive" type="button" onClick={() => remove(index)}>
        Remove
      </Button>
    </div>
  );
}
