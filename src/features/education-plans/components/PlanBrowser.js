import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useEducationPlans } from '../hooks/useEducationPlans';
import { PlanCard } from './PlanCard';
import { useAnalytics } from '../../../lib/analytics';
/**
 * Browse and discover education plans
 */
export function PlanBrowser({ onPlanSelect, showEnrolledOnly = false }) {
    const { data: allPlans, isLoading } = useEducationPlans();
    const { trackInteraction } = useAnalytics();
    const [filters, setFilters] = useState({
        search: '',
        difficultyLevel: '',
        tags: [],
        sortBy: 'recent'
    });
    const handlePlanClick = (planId) => {
        if (onPlanSelect) {
            onPlanSelect(planId);
        }
        trackInteraction('plan_browser', 'plan_clicked', { planId });
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        trackInteraction('plan_browser', 'filter_changed', { filter: key, value });
    };
    // Filter plans
    const filteredPlans = allPlans?.filter(plan => {
        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = plan.title.toLowerCase().includes(searchLower) ||
                plan.description?.toLowerCase().includes(searchLower);
            if (!matchesSearch)
                return false;
        }
        // Difficulty filter
        if (filters.difficultyLevel && plan.difficulty_level !== filters.difficultyLevel) {
            return false;
        }
        // Tags filter
        if (filters.tags.length > 0) {
            const planTags = plan.tags || [];
            const hasMatchingTag = filters.tags.some(tag => planTags.includes(tag));
            if (!hasMatchingTag)
                return false;
        }
        return true;
    });
    // Sort plans
    const sortedPlans = filteredPlans?.sort((a, b) => {
        switch (filters.sortBy) {
            case 'title':
                return a.title.localeCompare(b.title);
            case 'popular':
                // In real implementation, sort by enrollment count
                return 0;
            case 'recent':
            default:
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
    });
    // Get all unique tags from plans
    const allTags = Array.from(new Set(allPlans?.flatMap(plan => plan.tags || []) || [])).sort();
    if (isLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "h-20 bg-muted rounded-lg animate-pulse" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [1, 2, 3, 4, 5, 6].map((i) => (_jsx("div", { className: "h-64 bg-card border border-border rounded-lg animate-pulse" }, i))) })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-foreground", children: "Education Plans" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Structured learning paths to deepen your revolutionary education" })] }), _jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { className: "lg:col-span-2", children: [_jsx("label", { htmlFor: "search", className: "block text-sm font-medium text-foreground mb-2", children: "Search" }), _jsxs("div", { className: "relative", children: [_jsx("svg", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }), _jsx("input", { id: "search", type: "text", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value), placeholder: "Search plans...", className: "w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "difficulty", className: "block text-sm font-medium text-foreground mb-2", children: "Difficulty" }), _jsxs("select", { id: "difficulty", value: filters.difficultyLevel, onChange: (e) => handleFilterChange('difficultyLevel', e.target.value), className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", children: [_jsx("option", { value: "", children: "All levels" }), _jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "sort", className: "block text-sm font-medium text-foreground mb-2", children: "Sort by" }), _jsxs("select", { id: "sort", value: filters.sortBy, onChange: (e) => handleFilterChange('sortBy', e.target.value), className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", children: [_jsx("option", { value: "recent", children: "Most recent" }), _jsx("option", { value: "popular", children: "Most popular" }), _jsx("option", { value: "title", children: "Title (A-Z)" })] })] })] }), allTags.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Filter by tags" }), _jsx("div", { className: "flex flex-wrap gap-2", children: allTags.map((tag) => (_jsx("button", { onClick: () => {
                                        const newTags = filters.tags.includes(tag)
                                            ? filters.tags.filter(t => t !== tag)
                                            : [...filters.tags, tag];
                                        handleFilterChange('tags', newTags);
                                    }, className: `
                    px-3 py-1 text-sm rounded-full transition-colors
                    ${filters.tags.includes(tag)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                  `, children: tag }, tag))) })] }))] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: [sortedPlans?.length || 0, " plan", sortedPlans?.length !== 1 ? 's' : '', " found"] }), (filters.search || filters.difficultyLevel || filters.tags.length > 0) && (_jsx("button", { onClick: () => setFilters({
                            search: '',
                            difficultyLevel: '',
                            tags: [],
                            sortBy: 'recent'
                        }), className: "text-sm text-primary hover:text-primary/80 transition-colors", children: "Clear filters" }))] }), !sortedPlans || sortedPlans.length === 0 ? (_jsxs("div", { className: "bg-muted/50 border-2 border-dashed border-border rounded-lg p-12 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-muted-foreground", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsx("h3", { className: "text-lg font-medium text-foreground mb-2", children: "No plans found" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: filters.search || filters.difficultyLevel || filters.tags.length > 0
                            ? 'Try adjusting your filters to see more results.'
                            : 'No education plans are available yet. Check back later!' }), (filters.search || filters.difficultyLevel || filters.tags.length > 0) && (_jsx("button", { onClick: () => setFilters({
                            search: '',
                            difficultyLevel: '',
                            tags: [],
                            sortBy: 'recent'
                        }), className: "px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors", children: "Clear filters" }))] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: sortedPlans.map((plan) => (_jsx(PlanCard, { plan: plan, onClick: () => handlePlanClick(plan.id) }, plan.id))) }))] }));
}
