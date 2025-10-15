import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTopicReadings } from '../hooks/usePlanTopics';
import { useTopicProgress } from '../hooks/usePlanEnrollment';
import { useSession } from '../../../hooks/useSession';
import { useAnalytics } from '../../../lib/analytics';
/**
 * Individual topic card with details and optional progress tracking
 */
export function TopicCard({ topic, index, isExpanded, isEditable = false, showProgress = false, onClick }) {
    const { session } = useSession();
    const { data: readings } = useTopicReadings(topic.id);
    const { data: progress } = useTopicProgress(topic.id, session?.user?.id);
    const { trackInteraction } = useAnalytics();
    const [showEditModal, setShowEditModal] = useState(false);
    const handleEdit = (e) => {
        e.stopPropagation();
        setShowEditModal(true);
        trackInteraction('topic_card', 'edit_clicked', { topicId: topic.id });
    };
    const getProgressPercentage = () => {
        if (!progress)
            return 0;
        return progress.progress_percentage || 0;
    };
    const getStatusColor = () => {
        if (!progress)
            return 'bg-gray-200';
        switch (progress.status) {
            case 'completed':
                return 'bg-green-500';
            case 'in_progress':
                return 'bg-blue-500';
            default:
                return 'bg-gray-200';
        }
    };
    const getStatusText = () => {
        if (!progress)
            return 'Not started';
        switch (progress.status) {
            case 'completed':
                return 'Completed';
            case 'in_progress':
                return 'In progress';
            default:
                return 'Not started';
        }
    };
    const requiredReadings = readings?.filter(r => r.reading_type === 'required').length || 0;
    const totalReadings = readings?.length || 0;
    return (_jsxs("div", { onClick: onClick, className: `
        bg-card border border-border rounded-lg p-6 cursor-pointer transition-all
        hover:border-primary/50 hover:shadow-md
        ${isExpanded ? 'ring-2 ring-primary ring-offset-2' : ''}
      `, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-start space-x-3 flex-1", children: [_jsx("div", { className: `
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
            ${progress?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}
          `, children: progress?.status === 'completed' ? (_jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) })) : (index + 1) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("h3", { className: "font-semibold text-foreground text-lg", children: topic.title }), topic.is_required && (_jsx("span", { className: "inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded", children: "Required" }))] }), topic.description && (_jsx("p", { className: "text-sm text-muted-foreground line-clamp-2", children: topic.description })), _jsxs("div", { className: "flex items-center space-x-4 mt-3 text-xs text-muted-foreground", children: [topic.estimated_hours && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsxs("span", { children: [topic.estimated_hours, "h"] })] })), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }) }), _jsxs("span", { children: [requiredReadings, " required \u2022 ", totalReadings, " total readings"] })] }), showProgress && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${getStatusColor()}` }), _jsx("span", { children: getStatusText() })] }))] })] })] }), _jsxs("div", { className: "flex items-center space-x-2 ml-4", children: [isEditable && (_jsx("button", { onClick: handleEdit, className: "p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors", title: "Edit topic", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }) }) })), _jsx("svg", { className: `w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] })] }), showProgress && (_jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground mb-2", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [Math.round(getProgressPercentage()), "%"] })] }), _jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: `h-full transition-all ${getStatusColor()}`, style: { width: `${getProgressPercentage()}%` } }) })] })), isExpanded && readings && readings.length > 0 && (_jsxs("div", { className: "mt-6 pt-6 border-t border-border", children: [_jsx("h4", { className: "font-medium text-foreground mb-4", children: "Readings" }), _jsx("div", { className: "space-y-3", children: readings.map((reading) => (_jsxs("div", { className: "flex items-start space-x-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors", children: [_jsx("div", { className: `
                  w-2 h-2 rounded-full mt-2 flex-shrink-0
                  ${reading.reading_type === 'required' ? 'bg-primary' :
                                        reading.reading_type === 'further' ? 'bg-blue-500' : 'bg-gray-400'}
                ` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("h5", { className: "font-medium text-foreground text-sm", children: ["Resource #", reading.resource_id.slice(0, 8)] }), _jsx("span", { className: `
                      text-xs px-2 py-1 rounded
                      ${reading.reading_type === 'required' ? 'bg-primary/10 text-primary' :
                                                        reading.reading_type === 'further' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-600'}
                    `, children: reading.reading_type })] }), reading.notes && (_jsx("p", { className: "text-xs text-muted-foreground mt-1", children: reading.notes }))] })] }, reading.id))) })] }))] }));
}
