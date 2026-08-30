import { Box } from "@chakra-ui/react";
import { useState } from "react";
import { updateSettings } from "@/api/services";
import { StepBackends } from "./steps/StepBackends";
import { StepDone } from "./steps/StepDone";
import { StepGuide } from "./steps/StepGuide";
import { StepModelFolders } from "./steps/StepModelFolders";
import { StepWelcome } from "./steps/StepWelcome";

const STEPS = [StepWelcome, StepModelFolders, StepBackends, StepGuide, StepDone];
const TOTAL_STEPS = STEPS.length;

export interface IStepProps {
	goNext: () => void;
	goPrev: () => void;
	finishOnboarding: () => void;
}

export function OnboardingPage() {
	const [currentStep, setCurrentStep] = useState(0);

	const goNext = () => {
		setCurrentStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1));
	};

	const goPrev = () => {
		setCurrentStep((prev) => Math.max(0, prev - 1));
	};

	const finishOnboarding = async () => {
		await updateSettings({ isOnboardingComplete: true });
	};

	const StepComponent = STEPS[currentStep];
	const stepProps: IStepProps = { goNext, goPrev, finishOnboarding };

	return (
		<Box
			position="absolute"
			top="0"
			left="0"
			width="100%"
			height="100%"
			zIndex="99999"
			bg="var(--wc-bg-page)"
			overflow="auto"
		>
			<StepComponent {...stepProps} />
		</Box>
	);
}
