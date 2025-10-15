import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useEducationPlan } from '../hooks/useEducationPlans';
import { usePlanTopics } from '../hooks/usePlanTopics';
import { usePlanEnrollment, useEnrollInPlan } from '../hooks/usePlanEnrollment';
import { useSession } from '../../../hooks/useSession';
import { TopicList } from './TopicList';
import { useAnalytics } from '../../../lib/analytics';
/**
 * Detailed view of an education plan with enrollment functionality
 */
export function PlanDetailView({ planId, onBack, onStartLearning }) {
    const { session } = useSession();
    const { data: plan, isLoading: planLoading } = useEducationPlan(planId);
    const { data: topics } = usePlanTopics(planId);
    const { data: enrollment } = usePlanEnrollment(planId, session?.user?.id);
    const enrollInPlan = useEnrollInPlan();
    const { trackInteraction } = useAnalytics();
    const [showEnrollConfirm, setShowEnrollConfirm] = useState(false);
    const handleEnroll = async () => {
        if (!session?.user?.id)
            return;
        try {
            await enrollInPlan.mutateAsync(planId);
            setShowEnrollConfirm(false);
            trackInteraction('plan_detail', 'enrolled', { planId });
        }
        catch (error) {
            console.error('Failed to enroll in plan:', error);
        }
    };
    const handleStartLearning = () => {
        if (!topics || topics.length === 0)
            return;
        const firstTopic = topics.sort((a, b) => a.order_index - b.order_index)[0];
        if (onStartLearning) {
            onStartLearning(planId, firstTopic.id);
        }
        trackInteraction('plan_detail', 'start_learning', { planId, topicId: firstTopic.id });
    };
    const getDifficultyColor = (level) => {
        switch (level) {
            case 'beginner':
                return 'bg-green-100 text-green-700';
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-700';
            case 'advanced':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };
    const getEnrollmentStatus = () => {
        if (!enrollment)
            return 'not_enrolled';
        return enrollment.status;
    };
    const enrollmentStatus = getEnrollmentStatus();
    if (planLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "h-12 bg-muted rounded animate-pulse" }), _jsx("div", { className: "h-64 bg-card border border-border rounded-lg animate-pulse" }), _jsx("div", { className: "h-96 bg-card border border-border rounded-lg animate-pulse" })] }));
    }
    if (!plan) {
        return (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6", children: [_jsx("h3", { className: "font-medium text-red-900 mb-2", children: "Plan not found" }), _jsx("p", { className: "text-sm text-red-700", children: "This education plan doesn't exist or has been removed." }), onBack && (_jsx("button", { onClick: onBack, className: "mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors", children: "Go Back" }))] }));
    }
    const topicCount = topics?.length || 0;
    const requiredTopicCount = topics?.filter(t => t.is_required).length || 0;
    const totalEstimatedHours = topics?.reduce((sum, t) => sum + (t.estimated_hours || 0), 0) || 0;
    return (_jsxs("div", { className: "space-y-8", children: [onBack && (_jsxs("button", { onClick: onBack, className: "flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }), _jsx("span", { children: "Back to plans" })] })), _jsxs("div", { className: "bg-card border border-border rounded-lg p-8", children: [_jsx("div", { className: "flex items-start justify-between mb-6", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-3", children: [plan.difficulty_level && (_jsx("span", { className: `text-sm px-3 py-1 rounded-full font-medium ${getDifficultyColor(plan.difficulty_level)}`, children: plan.difficulty_level })), enrollmentStatus !== 'not_enrolled' && (_jsx("span", { className: `text-sm px-3 py-1 rounded-full font-medium ${enrollmentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                                enrollmentStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-purple-100 text-purple-700'}`, children: enrollmentStatus === 'completed' ? 'Completed' :
                                                enrollmentStatus === 'in_progress' ? 'In Progress' : 'Enrolled' })), plan.tags && plan.tags.map((tag) => (_jsx("span", { className: "text-sm px-3 py-1 bg-primary/10 text-primary rounded-full", children: tag }, tag)))] }), _jsx("h1", { className: "text-3xl font-bold text-foreground mb-3", children: plan.title }), plan.description && (_jsx("p", { className: "text-lg text-muted-foreground leading-relaxed", children: plan.description }))] }) }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6 mb-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-primary", children: topicCount }), _jsx("div", { className: "text-sm text-muted-foreground mt-1", children: "Topics" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-primary", children: requiredTopicCount }), _jsx("div", { className: "text-sm text-muted-foreground mt-1", children: "Required" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-3xl font-bold text-primary", children: [totalEstimatedHours, "h"] }), _jsx("div", { className: "text-sm text-muted-foreground mt-1", children: "Total Time" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-primary", children: plan.estimated_weeks || 0 }), _jsx("div", { className: "text-sm text-muted-foreground mt-1", children: "Weeks" })] })] }), enrollment && (_jsxs("div", { className: "bg-muted/30 rounded-lg p-4 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between text-sm text-foreground mb-2", children: [_jsx("span", { className: "font-medium", children: "Your Progress" }), _jsxs("span", { className: "font-bold", children: [Math.round(enrollment.progress_percentage || 0), "%"] })] }), _jsx("div", { className: "h-3 bg-background rounded-full overflow-hidden", children: _jsx("div", { className: `h-full transition-all ${enrollment.status === 'completed' ? 'bg-green-500' :
                                        enrollment.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`, style: { width: `${enrollment.progress_percentage || 0}%` } }) }), enrollment.started_at && (_jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: ["Started ", new Date(enrollment.started_at).toLocaleDateString(), enrollment.completed_at && (_jsxs("span", { children: [" \u2022 Completed ", new Date(enrollment.completed_at).toLocaleDateString()] }))] }))] })), _jsx("div", { className: "flex items-center space-x-3", children: enrollmentStatus === 'not_enrolled' ? (_jsx("button", { onClick: () => setShowEnrollConfirm(true), className: "px-6 py-3 bg-primary text-primary-foreground text-base font-semibold rounded-md hover:bg-primary/90 transition-colors", children: "Enroll in Plan" })) : (_jsx("button", { onClick: handleStartLearning, className: "px-6 py-3 bg-primary text-primary-foreground text-base font-semibold rounded-md hover:bg-primary/90 transition-colors", children: enrollmentStatus === 'completed' ? 'Review Topics' : 'Continue Learning' })) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-foreground mb-4", children: "Learning Topics" }), _jsx(TopicList, { planId: planId, showProgress: enrollmentStatus !== 'not_enrolled' })] }), showEnrollConfirm && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: _jsxs("div", { className: "bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4", children: [_jsx("h3", { className: "text-xl font-bold text-foreground mb-4", children: "Enroll in this plan?" }), _jsxs("p", { className: "text-sm text-muted-foreground mb-6", children: ["You're about to enroll in ", _jsxs("span", { className: "font-medium text-foreground", children: ["\"", plan.title, "\""] }), ". This plan includes ", topicCount, " topic", topicCount !== 1 ? 's' : '', " and takes approximately", ' ', plan.estimated_weeks, " week", plan.estimated_weeks !== 1 ? 's' : '', " to complete."] }), _jsxs("div", { className: "flex items-center justify-end space-x-3", children: [_jsx("button", { onClick: () => setShowEnrollConfirm(false), disabled: enrollInPlan.isPending, className: "px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors", children: "Cancel" }), _jsx("button", { onClick: handleEnroll, disabled: enrollInPlan.isPending, className: "px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: enrollInPlan.isPending ? 'Enrolling...' : 'Confirm Enrollment' })] })] }) }))] }));
}
