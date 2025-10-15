import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useProfile } from '../../../hooks/useProfile';
import { PlanBrowser } from '../components/PlanBrowser';
import { PlanDetailView } from '../components/PlanDetailView';
import { PlanWizard } from '../components/PlanWizard/PlanWizard';
/**
 * Main education plans page
 * Shows plan browser, detail view, or creation wizard based on user interaction
 */
export function EducationPlansPage() {
    const { isFacilitator } = useProfile();
    const [viewMode, setViewMode] = useState('browse');
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const handlePlanSelect = (planId) => {
        setSelectedPlanId(planId);
        setViewMode('detail');
    };
    const handleCreatePlan = () => {
        setViewMode('create');
    };
    const handleBackToBrowse = () => {
        setViewMode('browse');
        setSelectedPlanId(null);
    };
    const handlePlanCreated = () => {
        // After successful creation, go back to browse
        setViewMode('browse');
        setSelectedPlanId(null);
    };
    const handleStartLearning = (_planId, _topicId) => {
        // TODO: route to reader experience once implemented
    };
    return (_jsx("div", { className: "min-h-screen bg-background", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [viewMode === 'browse' && (_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-foreground", children: "Education Plans" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Structured learning paths to deepen your revolutionary education" })] }), isFacilitator && (_jsxs("button", { onClick: handleCreatePlan, className: "px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }), _jsx("span", { children: "Create Plan" })] }))] })), _jsxs("div", { children: [viewMode === 'browse' && (_jsx(PlanBrowser, { onPlanSelect: handlePlanSelect })), viewMode === 'detail' && selectedPlanId && (_jsx(PlanDetailView, { planId: selectedPlanId, onBack: handleBackToBrowse, onStartLearning: handleStartLearning })), viewMode === 'create' && (_jsxs("div", { className: "bg-card border border-border rounded-lg p-8", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("button", { onClick: handleBackToBrowse, className: "flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-4", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }), _jsx("span", { children: "Back to plans" })] }), _jsx("h2", { className: "text-2xl font-bold text-foreground", children: "Create Education Plan" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Build a structured learning path with topics and readings" })] }), _jsx(PlanWizard, { onSuccess: handlePlanCreated, onCancel: handleBackToBrowse })] }))] })] }) }));
}
