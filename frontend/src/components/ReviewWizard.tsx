"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReviewStepOne from "./ReviewStepOne";
import ReviewStepTwo from "./ReviewStepTwo";

export default function ReviewWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [reviewId, setReviewId] = useState(0);
  const [strainName, setStrainName] = useState("");

  function handleStepOneSuccess(id: number, name: string) {
    setReviewId(id);
    setStrainName(name);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDone() {
    router.push("/portal/dashboard");
  }

  if (step === 2) {
    return (
      <ReviewStepTwo
        reviewId={reviewId}
        strainName={strainName}
        onDone={handleDone}
      />
    );
  }

  return (
    <ReviewStepOne
      onSuccess={handleStepOneSuccess}
      onCancel={() => router.push("/portal/dashboard")}
    />
  );
}
