import { StepType, TourProvider } from "@reactour/tour";
import { FC } from "react";

interface IOnboardingProps extends React.PropsWithChildren {
    steps: StepType[];
    domainKey: string;
}

const Onboarding: FC<IOnboardingProps> = ({ steps, domainKey, children }) => {
    const onboardingKey = domainKey + "OnboardingCompletedEarlier";

    const onboardingCompletedEarlier = localStorage.getItem(onboardingKey);

    return (
        <TourProvider
            steps={steps}
            defaultOpen={!onboardingCompletedEarlier}
            onClickClose={({ setIsOpen, setCurrentStep }) => {
                setIsOpen(false);
                setCurrentStep(0);
                localStorage.setItem(onboardingKey, "true");
            }}
        >
            {children}
        </TourProvider>
    );
};

export { Onboarding };
