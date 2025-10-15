import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTopicReadings } from '../hooks/usePlanTopics';
import { useResources } from '../../library/hooks/useResources';
import { useAnalytics } from '../../../lib/analytics';
/**
 * Display list of readings for a topic
 */
export function ReadingList({ topicId, showProgress = false, onReadingClick }) {
    const { data: readings, isLoading } = useTopicReadings(topicId);
    const { data: resources } = useResources();
    const { trackInteraction } = useAnalytics();
    const handleReadingClick = (resourceId) => {
        if (onReadingClick) {
            onReadingClick(resourceId);
            trackInteraction('reading_list', 'reading_clicked', { resourceId, topicId });
        }
    };
    const getResourceDetails = (resourceId) => {
        return resources?.find(r => r.id === resourceId);
    };
    const getReadingTypeColor = (type) => {
        switch (type) {
            case 'required':
                return 'bg-primary/10 text-primary border-primary/20';
            case 'further':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'optional':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };
    const getReadingTypeDotColor = (type) => {
        switch (type) {
            case 'required':
                return 'bg-primary';
            case 'further':
                return 'bg-blue-500';
            case 'optional':
                return 'bg-gray-400';
            default:
                return 'bg-gray-400';
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-20 bg-card border border-border rounded-lg animate-pulse" }, i))) }));
    }
    if (!readings || readings.length === 0) {
        return (_jsxs("div", { className: "bg-muted/50 border-2 border-dashed border-border rounded-lg p-8 text-center", children: [_jsx("div", { className: "w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx("svg", { className: "w-6 h-6 text-muted-foreground", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }) }) }), _jsx("p", { className: "text-sm text-muted-foreground", children: "No readings assigned to this topic yet" })] }));
    }
    // Group readings by type
    const requiredReadings = readings.filter(r => r.reading_type === 'required');
    const furtherReadings = readings.filter(r => r.reading_type === 'further');
    const optionalReadings = readings.filter(r => r.reading_type === 'optional');
    return (_jsxs("div", { className: "space-y-6", children: [requiredReadings.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-foreground mb-3 flex items-center", children: [_jsx("span", { className: "w-2 h-2 bg-primary rounded-full mr-2" }), "Required Readings"] }), _jsx("div", { className: "space-y-2", children: requiredReadings.map((reading) => {
                            const resource = getResourceDetails(reading.resource_id);
                            return (_jsx(ReadingCard, { reading: reading, resource: resource, onClick: () => handleReadingClick(reading.resource_id), showProgress: showProgress }, reading.id));
                        }) })] })), furtherReadings.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-foreground mb-3 flex items-center", children: [_jsx("span", { className: "w-2 h-2 bg-blue-500 rounded-full mr-2" }), "Further Reading"] }), _jsx("div", { className: "space-y-2", children: furtherReadings.map((reading) => {
                            const resource = getResourceDetails(reading.resource_id);
                            return (_jsx(ReadingCard, { reading: reading, resource: resource, onClick: () => handleReadingClick(reading.resource_id), showProgress: showProgress }, reading.id));
                        }) })] })), optionalReadings.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-foreground mb-3 flex items-center", children: [_jsx("span", { className: "w-2 h-2 bg-gray-400 rounded-full mr-2" }), "Optional Readings"] }), _jsx("div", { className: "space-y-2", children: optionalReadings.map((reading) => {
                            const resource = getResourceDetails(reading.resource_id);
                            return (_jsx(ReadingCard, { reading: reading, resource: resource, onClick: () => handleReadingClick(reading.resource_id), showProgress: showProgress }, reading.id));
                        }) })] }))] }));
}
/**
 * Individual reading card
 */
function ReadingCard({ reading, resource, onClick, showProgress }) {
    const getReadingTypeColor = (type) => {
        switch (type) {
            case 'required':
                return 'bg-primary/10 text-primary';
            case 'further':
                return 'bg-blue-100 text-blue-700';
            case 'optional':
                return 'bg-gray-100 text-gray-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };
    return (_jsx("div", { onClick: onClick, className: "bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("h5", { className: "font-medium text-foreground", children: resource?.title || 'Loading...' }), _jsx("span", { className: `text-xs px-2 py-1 rounded ${getReadingTypeColor(reading.reading_type)}`, children: reading.reading_type })] }), resource?.author && (_jsxs("p", { className: "text-sm text-muted-foreground mb-2", children: ["by ", resource.author] })), reading.notes && (_jsxs("p", { className: "text-sm text-muted-foreground italic", children: ["\"", reading.notes, "\""] })), resource && (_jsxs("div", { className: "flex items-center space-x-4 mt-3 text-xs text-muted-foreground", children: [_jsxs("span", { className: "flex items-center space-x-1", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }), _jsx("span", { children: resource.type })] }), resource.totalWordCount && (_jsxs("span", { className: "flex items-center space-x-1", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsxs("span", { children: [Math.ceil(resource.totalWordCount / 200), " min read"] })] }))] }))] }), _jsx("div", { className: "ml-4", children: _jsx("svg", { className: "w-5 h-5 text-muted-foreground", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }) })] }) }));
}
