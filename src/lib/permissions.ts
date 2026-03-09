import { SubscriptionLevel } from "@/lib/subscription";

//return true of false
export function canCreateResume(
  subscriptionLevel: SubscriptionLevel,
  currentResumeCount: number,
) {
  const maxResumeMap: Record<SubscriptionLevel, number> = {
    free: 1,
    pro: 3,
    pro_plus: Infinity,
  };

  const maxResumes = maxResumeMap[subscriptionLevel]; //maxResumeMap[free] => 1, maxResumeMap[pro]=>3

  console.log(maxResumes);

  return currentResumeCount < maxResumes; //company user current resume count in db to the max for his plan package then return true or false
}

export function canUseAITools(subscriptionLevel: SubscriptionLevel) {
  return subscriptionLevel !== "free";
}

export function canUseCustomizations(subscriptionLevel: SubscriptionLevel) {
  return subscriptionLevel === "pro_plus";
}
