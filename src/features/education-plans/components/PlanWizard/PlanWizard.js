import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { PlanDetailsStep } from './PlanDetailsStep';
import { TopicsStep } from './TopicsStep';
import { ReadingsStep } from './ReadingsStep';
import { ReviewStep } from './ReviewStep';
import { useCreateEducationPlan } from '../../hooks/useEducationPlans';
import { useAnalytics } from '../../../../lib/analytics';
const STEPS = [
    { id: 'details', title: 'Plan Details', description: 'Basic information about your education plan' },
    { id: 'topics', title: 'Topics', description: 'Create and organize learning topics' },
    { id: 'readings', title: 'Reading Assignments', description: 'Assign readings to each topic' },
    { id: 'review', title: 'Review & Publish', description: 'Review and publish your plan' }
];
/**
 * Multi-step wizard for creating education plans
 */
export function PlanWizard({ initialData, onSuccess, onCancel }) {
    const [currentStep, setCurrentStep] = useState('details');
    const [wizardData, setWizardData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        cohortId: initialData?.cohortId,
        estimatedWeeks: 4,
        difficultyLevel: 'beginner',
        tags: [],
        topics: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const createPlan = useCreateEducationPlan();
    const { trackInteraction } = useAnalytics();
    const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === STEPS.length - 1;
    const handleNext = async () => {
        if (isLastStep) {
            // Submit the plan
            await handleSubmit();
        }
        else {
            // Move to next step
            trackInteraction('plan_wizard', 'next_step', {
                fromStep: currentStep,
                toStep: STEPS[currentStepIndex + 1].id
            });
            setCurrentStep(STEPS[currentStepIndex + 1].id);
        }
    };
    const handleBack = () => {
        if (!isFirstStep) {
            trackInteraction('plan_wizard', 'previous_step', {
                fromStep: currentStep,
                toStep: STEPS[currentStepIndex - 1].id
            });
            setCurrentStep(STEPS[currentStepIndex - 1].id);
        }
    };
    const handleSubmit = async () => {
        if (isSubmitting)
            return;
        try {
            setIsSubmitting(true);
            trackInteraction('plan_wizard', 'submit', {
                step: currentStep,
                hasTopics: wizardData.topics.length > 0,
                totalReadings: wizardData.topics.reduce((sum, topic) => sum + topic.readings.length, 0)
            });
            const plan = await createPlan.mutateAsync(wizardData);
            trackInteraction('plan_wizard', 'created', {
                planId: plan.id,
                planTitle: plan.title,
                totalTopics: wizardData.topics.length
            });
            onSuccess?.(plan.id);
        }
        catch (error) {
            console.error('Failed to create plan:', error);
            // TODO: Show error message to user
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleCancel = () => {
        trackInteraction('plan_wizard', 'cancel', {
            step: currentStep,
            hasData: wizardData.title !== '' || wizardData.topics.length > 0
        });
        onCancel?.();
    };
    const updateWizardData = (updates) => {
        setWizardData(prev => ({ ...prev, ...updates }));
    };
    const renderStep = () => {
        switch (currentStep) {
            case 'details':
                return (_jsx(PlanDetailsStep, { data: wizardData, onChange: updateWizardData, onNext: handleNext, onCancel: handleCancel }));
            case 'topics':
                return (_jsx(TopicsStep, { data: wizardData, onChange: updateWizardData, onNext: handleNext, onBack: handleBack, onCancel: handleCancel }));
            case 'readings':
                return (_jsx(ReadingsStep, { data: wizardData, onChange: updateWizardData, onNext: handleNext, onBack: handleBack, onCancel: handleCancel }));
            case 'review':
                return (_jsx(ReviewStep, { data: wizardData, onChange: updateWizardData, onNext: handleNext, onBack: handleBack, onCancel: handleCancel, isSubmitting: isSubmitting }));
            default:
                return null;
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx("div", { className: "border-b border-border", children: _jsx("div", { className: "max-w-4xl mx-auto px-4 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-foreground", children: "Create Education Plan" }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Design a structured learning path with topics and reading assignments" })] }), _jsx("button", { onClick: handleCancel, className: "inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors", "aria-label": "Cancel plan creation", children: "Cancel" })] }) }) }), _jsx("div", { className: "border-b border-border bg-card", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center space-x-1", children: STEPS.map((step, index) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `
                      relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
                      ${index <= currentStepIndex
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'}
                    `, children: index + 1 }), index < STEPS.length - 1 && (_jsx("div", { className: `
                        w-12 h-px mx-2
                        ${index < currentStepIndex
                                                    ? 'bg-primary'
                                                    : 'bg-muted'}
                      ` }))] }, step.id))) }), _jsxs("div", { className: "text-sm text-muted-foreground", children: ["Step ", currentStepIndex + 1, " of ", STEPS.length, ": ", STEPS[currentStepIndex].title] })] }), _jsx("div", { className: "mt-2", children: _jsx("p", { className: "text-sm text-muted-foreground", children: STEPS[currentStepIndex].description }) })] }) }), _jsx("div", { className: "max-w-4xl mx-auto px-4 py-8", children: _jsx("div", { className: "bg-card border border-border rounded-lg p-6", children: renderStep() }) }), _jsx("div", { className: "border-t border-border bg-card", children: _jsx("div", { className: "max-w-4xl mx-auto px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { onClick: handleBack, disabled: isFirstStep || isSubmitting, className: "inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: [_jsx("svg", { className: "w-4 h-4 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }), isFirstStep ? 'Cancel' : 'Previous'] }), !isLastStep ? (_jsxs("button", { onClick: handleNext, disabled: isSubmitting, className: "inline-flex items-center px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: ["Continue", _jsx("svg", { className: "w-4 h-4 ml-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })] })) : (_jsx("button", { onClick: handleSubmit, disabled: isSubmitting || wizardData.title.trim() === '' || wizardData.topics.length === 0, className: "inline-flex items-center px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Creating Plan..."] })) : (_jsxs(_Fragment, { children: ["Create Plan", _jsx("svg", { className: "w-4 h-4 ml-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) })] })) }))] }) }) })] }));
}
