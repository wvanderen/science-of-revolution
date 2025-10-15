import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAnalytics } from '../../../../lib/analytics';
/**
 * Review step of the plan wizard - review plan details and publish
 */
export function ReviewStep({ data, onChange, onNext, onBack, onCancel, isSubmitting }) {
    const [publishSettings, setPublishSettings] = useState({
        isPublic: true,
        allowEnrollment: true,
        requiresApproval: false
    });
    const [isPublished, setIsPublished] = useState(false);
    const { trackInteraction } = useAnalytics();
    const handlePublish = async () => {
        if (isSubmitting)
            return;
        trackInteraction('review_step', 'publish_plan', {
            planTitle: data.title,
            totalTopics: data.topics.length,
            totalReadings: data.topics.reduce((sum, topic) => sum + topic.readings.length, 0),
            publishSettings
        });
        setIsPublished(true);
        onNext();
    };
    const handleSaveDraft = async () => {
        if (isSubmitting)
            return;
        trackInteraction('review_step', 'save_draft', {
            planTitle: data.title,
            totalTopics: data.topics.length
        });
        // In a real implementation, this would save as draft
        onNext();
    };
    const getTotalEstimatedHours = () => {
        return data.topics.reduce((total, topic) => total + topic.estimatedHours, 0);
    };
    const getTotalReadings = () => {
        return data.topics.reduce((total, topic) => total + topic.readings.length, 0);
    };
    const getRequiredReadingsCount = () => {
        return data.topics.reduce((total, topic) => total + topic.readings.filter(r => r.readingType === 'required').length, 0);
    };
    const getRequiredTopicsCount = () => {
        return data.topics.filter(topic => topic.isRequired).length;
    };
    const hasRequiredReadings = () => {
        return data.topics.some(topic => topic.readings.some(reading => reading.readingType === 'required'));
    };
    const getReadingTypeDistribution = () => {
        const distribution = { required: 0, further: 0, optional: 0 };
        data.topics.forEach(topic => {
            topic.readings.forEach(reading => {
                distribution[reading.readingType]++;
            });
        });
        return distribution;
    };
    const canPublish = () => {
        return data.title.trim() !== '' &&
            data.topics.length > 0 &&
            hasRequiredReadings();
    };
    const readingDistribution = getReadingTypeDistribution();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-foreground", children: "Review & Publish" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Review your education plan details and configure publishing settings." })] }), _jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [_jsx("h4", { className: "font-medium text-foreground mb-4", children: "Plan Overview" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("h5", { className: "font-medium text-foreground", children: data.title }), data.description && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: data.description }))] }), _jsx("div", { className: "flex flex-wrap gap-2", children: data.tags.map((tag) => (_jsx("span", { className: "inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded", children: tag }, tag))) }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Difficulty:" }), _jsx("span", { className: "font-medium capitalize", children: data.difficultyLevel })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Duration:" }), _jsxs("span", { className: "font-medium", children: [data.estimatedWeeks, " week", data.estimatedWeeks !== 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Cohort:" }), _jsx("span", { className: "font-medium", children: data.cohortId ? 'Assigned' : 'General Template' })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h5", { className: "font-medium text-foreground", children: "Statistics" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { className: "bg-muted/50 rounded p-3", children: [_jsx("div", { className: "text-2xl font-bold text-primary", children: data.topics.length }), _jsx("div", { className: "text-muted-foreground", children: "Topics" }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [getRequiredTopicsCount(), " required"] })] }), _jsxs("div", { className: "bg-muted/50 rounded p-3", children: [_jsx("div", { className: "text-2xl font-bold text-primary", children: getTotalReadings() }), _jsx("div", { className: "text-muted-foreground", children: "Readings" }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [getRequiredReadingsCount(), " required"] })] }), _jsxs("div", { className: "bg-muted/50 rounded p-3", children: [_jsx("div", { className: "text-2xl font-bold text-primary", children: getTotalEstimatedHours() }), _jsx("div", { className: "text-muted-foreground", children: "Total Hours" }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: ["~", Math.ceil(getTotalEstimatedHours() / data.estimatedWeeks), "h/week"] })] }), _jsxs("div", { className: "bg-muted/50 rounded p-3", children: [_jsxs("div", { className: "text-2xl font-bold text-primary", children: [Math.round((getRequiredReadingsCount() / Math.max(getTotalReadings(), 1)) * 100), "%"] }), _jsx("div", { className: "text-muted-foreground", children: "Core Content" }), _jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "Required readings" })] })] })] })] })] }), _jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [_jsx("h4", { className: "font-medium text-foreground mb-4", children: "Topics & Readings" }), _jsx("div", { className: "space-y-4", children: data.topics.map((topic, index) => (_jsxs("div", { className: "border-l-2 border-border pl-4", children: [_jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-sm text-muted-foreground", children: ["#", index + 1] }), _jsx("h5", { className: "font-medium text-foreground", children: topic.title }), topic.isRequired && (_jsx("span", { className: "inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded", children: "Required" }))] }), topic.description && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: topic.description })), _jsxs("div", { className: "flex items-center space-x-4 mt-2 text-xs text-muted-foreground", children: [_jsxs("span", { children: [topic.estimatedHours, "h estimated"] }), _jsxs("span", { children: [topic.readings.length, " reading", topic.readings.length !== 1 ? 's' : ''] }), _jsxs("span", { children: [topic.readings.filter(r => r.readingType === 'required').length, " required"] })] })] }) }), topic.readings.length > 0 && (_jsx("div", { className: "mt-3 space-y-1", children: topic.readings.map((reading) => (_jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx("div", { className: `
                        w-2 h-2 rounded-full
                        ${reading.readingType === 'required' ? 'bg-primary' :
                                                    reading.readingType === 'further' ? 'bg-blue-500' : 'bg-gray-400'}
                      ` }), _jsx("span", { className: "text-foreground", children: reading.resourceTitle }), _jsx("span", { className: `
                        text-xs px-1 py-0.5 rounded
                        ${reading.readingType === 'required' ? 'bg-primary/10 text-primary' :
                                                    reading.readingType === 'further' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                      `, children: reading.readingType })] }, reading.id))) }))] }, topic.id))) })] }), _jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [_jsx("h4", { className: "font-medium text-foreground mb-4", children: "Publishing Settings" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "flex items-center space-x-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: publishSettings.isPublic, onChange: (e) => setPublishSettings({
                                            ...publishSettings,
                                            isPublic: e.target.checked
                                        }), className: "rounded border-input" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: "Make plan publicly discoverable" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Other users can find and enroll in this education plan" })] })] }), _jsxs("label", { className: "flex items-center space-x-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: publishSettings.allowEnrollment, onChange: (e) => setPublishSettings({
                                            ...publishSettings,
                                            allowEnrollment: e.target.checked
                                        }), className: "rounded border-input" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: "Allow open enrollment" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "Users can enroll without approval" })] })] }), publishSettings.allowEnrollment && (_jsxs("label", { className: "flex items-center space-x-3 cursor-pointer ml-6", children: [_jsx("input", { type: "checkbox", checked: publishSettings.requiresApproval, onChange: (e) => setPublishSettings({
                                            ...publishSettings,
                                            requiresApproval: e.target.checked
                                        }), className: "rounded border-input" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: "Require approval for enrollment" }), _jsx("div", { className: "text-sm text-muted-foreground", children: "You must approve each enrollment request" })] })] }))] })] }), !canPublish() && (_jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "h-5 w-5 text-yellow-400", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }) }), _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-yellow-800", children: "Plan needs attention before publishing" }), _jsx("div", { className: "mt-2 text-sm text-yellow-700", children: _jsxs("ul", { className: "list-disc list-inside space-y-1", children: [data.title.trim() === '' && _jsx("li", { children: "Add a plan title" }), data.topics.length === 0 && _jsx("li", { children: "Add at least one topic" }), !hasRequiredReadings() && _jsx("li", { children: "Add at least one required reading" })] }) })] })] }) })), isPublished && (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "h-5 w-5 text-green-400", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }) }), _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-green-800", children: "Plan published successfully!" }), _jsx("div", { className: "mt-2 text-sm text-green-700", children: "Your education plan is now available for learners to discover and enroll." })] })] }) }))] }));
}
