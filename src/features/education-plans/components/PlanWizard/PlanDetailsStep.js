import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useUserCohorts } from '../../../../hooks/useUserCohorts';
import { useAnalytics } from '../../../../lib/analytics';
const DIFFICULTY_OPTIONS = [
    { value: 'beginner', label: 'Beginner', description: 'No prior knowledge required' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some background knowledge helpful' },
    { value: 'advanced', label: 'Advanced', description: 'Extensive background knowledge required' }
];
const ESTIMATED_WEEKS_OPTIONS = [1, 2, 3, 4, 6, 8, 10, 12, 16];
const COMMON_TAGS = [
    'Marxism',
    'Political Economy',
    'History',
    'Philosophy',
    'Sociology',
    'Theory',
    'Practice',
    'Introduction',
    'Advanced',
    'Contemporary'
];
/**
 * First step of the plan wizard - basic plan information
 */
export function PlanDetailsStep({ data, onChange, onNext, onCancel }) {
    const [tagInput, setTagInput] = useState('');
    const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
    const { data: cohorts, isLoading: cohortsLoading } = useUserCohorts();
    const { trackInteraction } = useAnalytics();
    const handleAddTag = (tag) => {
        if (tag && !data.tags.includes(tag)) {
            onChange({ tags: [...data.tags, tag] });
            trackInteraction('plan_details', 'add_tag', { tag });
        }
        setTagInput('');
        setIsTagMenuOpen(false);
    };
    const handleRemoveTag = (tag) => {
        onChange({ tags: data.tags.filter(t => t !== tag) });
        trackInteraction('plan_details', 'remove_tag', { tag });
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = tagInput.trim();
            if (tag) {
                handleAddTag(tag);
            }
        }
    };
    const isValid = data.title.trim() !== '';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "plan-title", className: "block text-sm font-medium text-foreground mb-2", children: "Plan Title *" }), _jsx("input", { id: "plan-title", type: "text", value: data.title, onChange: (e) => onChange({ title: e.target.value }), placeholder: "e.g., Introduction to Marxist Economics", className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "plan-description", className: "block text-sm font-medium text-foreground mb-2", children: "Description" }), _jsx("textarea", { id: "plan-description", value: data.description, onChange: (e) => onChange({ description: e.target.value }), placeholder: "Provide an overview of what learners will accomplish in this plan...", rows: 4, className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "plan-cohort", className: "block text-sm font-medium text-foreground mb-2", children: "Assign to Cohort" }), _jsxs("select", { id: "plan-cohort", value: data.cohortId || '', onChange: (e) => onChange({ cohortId: e.target.value || undefined }), className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", children: [_jsx("option", { value: "", children: "Select a cohort (optional)" }), cohorts?.map((cohort) => (_jsx("option", { value: cohort.id, children: cohort.name }, cohort.id))) || []] }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Leave blank to create a general template, or assign to a specific cohort for targeted learning." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-3", children: "Difficulty Level" }), _jsx("div", { className: "grid grid-cols-1 gap-3", children: DIFFICULTY_OPTIONS.map((option) => (_jsxs("label", { className: "relative flex cursor-pointer rounded-lg border p-4 hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("input", { type: "radio", name: "difficulty", value: option.value, checked: data.difficultyLevel === option.value, onChange: (e) => onChange({ difficultyLevel: e.target.value }), className: "sr-only" }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-4 h-4 border-2 border-primary rounded-full mr-3 flex items-center justify-center", children: data.difficultyLevel === option.value && (_jsx("div", { className: "w-2 h-2 bg-primary rounded-full" })) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-foreground", children: option.label }), _jsx("div", { className: "text-sm text-muted-foreground", children: option.description })] })] })] }, option.value))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "plan-duration", className: "block text-sm font-medium text-foreground mb-3", children: "Estimated Duration" }), _jsx("select", { id: "plan-duration", value: data.estimatedWeeks, onChange: (e) => onChange({ estimatedWeeks: parseInt(e.target.value) }), className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", children: ESTIMATED_WEEKS_OPTIONS.map((weeks) => (_jsx("option", { value: weeks, children: weeks === 1 ? '1 week' : `${weeks} weeks` }, weeks))) }), _jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "This helps learners plan their time and set expectations." })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "plan-tags", className: "block text-sm font-medium text-foreground mb-3", children: "Tags" }), _jsx("div", { className: "relative", children: _jsxs("div", { className: "flex flex-wrap gap-2 mb-3", children: [data.tags.map((tag) => (_jsxs("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20", children: [tag, _jsx("button", { onClick: () => handleRemoveTag(tag), className: "ml-2 text-primary/70 hover:text-primary", "aria-label": `Remove ${tag} tag`, children: _jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }, tag))), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "plan-tags", type: "text", value: tagInput, onChange: (e) => setTagInput(e.target.value), onKeyDown: handleKeyPress, onFocus: () => setIsTagMenuOpen(true), onBlur: () => setTimeout(() => setIsTagMenuOpen(false), 200), placeholder: "Add tag...", className: "px-3 py-1 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-32" }), isTagMenuOpen && (_jsx("div", { className: "absolute top-full left-0 mt-1 z-10 bg-popover border border-border rounded-md shadow-lg p-2", children: _jsx("div", { className: "space-y-1", children: COMMON_TAGS.filter(tag => !data.tags.includes(tag)).map((tag) => (_jsx("button", { type: "button", onClick: () => handleAddTag(tag), className: "block w-full text-left px-2 py-1 text-sm hover:bg-accent rounded transition-colors", children: tag }, tag))) }) }))] })] }) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Tags help categorize and filter plans. Common suggestions are shown above." })] })] }));
}
