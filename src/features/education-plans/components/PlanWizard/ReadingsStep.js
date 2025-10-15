import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useResources } from '../../../library/hooks/useResources';
import { useAnalytics } from '../../../../lib/analytics';
/**
 * Readings step of the plan wizard - assign readings to topics
 */
export function ReadingsStep({ data, onChange, onNext, onBack, onCancel }) {
    const [selectedTopicId, setSelectedTopicId] = useState(data.topics.length > 0 ? data.topics[0].id : null);
    const [readingForm, setReadingForm] = useState({
        resourceId: '',
        resourceTitle: '',
        readingType: 'required',
        notes: ''
    });
    const [resourceSearch, setResourceSearch] = useState('');
    const [showResourceSelector, setShowResourceSelector] = useState(false);
    const { data: resources, isLoading: resourcesLoading } = useResources();
    const { trackInteraction } = useAnalytics();
    const selectedTopic = data.topics.find(t => t.id === selectedTopicId);
    const filteredResources = resources?.filter(resource => resource.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
        resource.author?.toLowerCase().includes(resourceSearch.toLowerCase())) || [];
    const handleAddReading = () => {
        if (!selectedTopicId || !readingForm.resourceId)
            return;
        const newReading = {
            id: Date.now().toString(),
            resourceId: readingForm.resourceId,
            resourceTitle: readingForm.resourceTitle,
            readingType: readingForm.readingType,
            orderIndex: selectedTopic?.readings.length || 0,
            notes: readingForm.notes || undefined
        };
        onChange({
            topics: data.topics.map(topic => topic.id === selectedTopicId
                ? { ...topic, readings: [...topic.readings, newReading] }
                : topic)
        });
        setReadingForm({
            resourceId: '',
            resourceTitle: '',
            readingType: 'required',
            notes: ''
        });
        setShowResourceSelector(false);
        setResourceSearch('');
        trackInteraction('readings_step', 'add_reading', {
            topicId: selectedTopicId,
            readingType: readingForm.readingType
        });
    };
    const handleRemoveReading = (topicId, readingId) => {
        onChange({
            topics: data.topics.map(topic => {
                if (topic.id === topicId) {
                    const updatedReadings = topic.readings
                        .filter(r => r.id !== readingId)
                        .map((r, index) => ({ ...r, orderIndex: index }));
                    return { ...topic, readings: updatedReadings };
                }
                return topic;
            })
        });
        trackInteraction('readings_step', 'remove_reading', {
            topicId,
            readingId
        });
    };
    const handleUpdateReading = (topicId, readingId, updates) => {
        onChange({
            topics: data.topics.map(topic => {
                if (topic.id === topicId) {
                    return {
                        ...topic,
                        readings: topic.readings.map(reading => reading.id === readingId ? { ...reading, ...updates } : reading)
                    };
                }
                return topic;
            })
        });
        if (updates.readingType !== undefined) {
            trackInteraction('readings_step', 'update_reading_type', {
                topicId,
                readingId,
                newType: updates.readingType
            });
        }
    };
    const handleReorderReadings = (result) => {
        if (!result.destination || !selectedTopicId)
            return;
        const topic = data.topics.find(t => t.id === selectedTopicId);
        if (!topic)
            return;
        const items = Array.from(topic.readings);
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        const [movedItem] = items.splice(sourceIndex, 1);
        if (!movedItem)
            return;
        items.splice(destinationIndex, 0, movedItem);
        const reorderedReadings = items.map((item, index) => ({
            ...item,
            orderIndex: index
        }));
        onChange({
            topics: data.topics.map(t => t.id === selectedTopicId ? { ...t, readings: reorderedReadings } : t)
        });
        trackInteraction('readings_step', 'reorder_readings', {
            topicId: selectedTopicId,
            totalReadings: items.length
        });
    };
    const handleSelectResource = (resource) => {
        setReadingForm({
            ...readingForm,
            resourceId: resource.id,
            resourceTitle: resource.title
        });
        setShowResourceSelector(false);
        setResourceSearch('');
        trackInteraction('readings_step', 'select_resource', {
            resourceId: resource.id,
            resourceTitle: resource.title
        });
    };
    const getTotalReadingsCount = () => {
        return data.topics.reduce((total, topic) => total + topic.readings.length, 0);
    };
    const hasRequiredReadings = () => {
        return data.topics.some(topic => topic.readings.some(reading => reading.readingType === 'required'));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-foreground", children: "Reading Assignments" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Assign readings to each topic. You can select from existing resources or add new ones." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Select Topic" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: data.topics.map((topic) => (_jsxs("button", { onClick: () => setSelectedTopicId(topic.id), className: `
                p-3 text-left rounded-lg border transition-colors
                ${selectedTopicId === topic.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'}
              `, children: [_jsx("div", { className: "font-medium text-foreground", children: topic.title }), _jsxs("div", { className: "text-sm text-muted-foreground mt-1", children: [topic.readings.length, " reading", topic.readings.length !== 1 ? 's' : ''] })] }, topic.id))) })] }), selectedTopic && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h4", { className: "font-medium text-foreground", children: ["Readings for \"", selectedTopic.title, "\""] }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [selectedTopic.readings.length, " reading", selectedTopic.readings.length !== 1 ? 's' : ''] })] }), selectedTopic.readings.length > 0 ? (_jsx(DragDropContext, { onDragEnd: handleReorderReadings, children: _jsx(Droppable, { droppableId: "readings", children: (droppableProvided) => (_jsxs("div", { ...droppableProvided.droppableProps, ref: droppableProvided.innerRef, className: "space-y-3", children: [selectedTopic.readings.map((reading, index) => (_jsx(Draggable, { draggableId: reading.id, index: index, children: (provided, snapshot) => (_jsx("div", { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps, className: `
                              bg-card border border-border rounded-lg p-4 cursor-move hover:border-primary/50 transition-colors
                              ${snapshot.isDragging ? 'opacity-50' : ''}
                            `, children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex items-start space-x-3 flex-1", children: [_jsx("div", { className: "mt-1", children: _jsx("svg", { className: "w-4 h-4 text-muted-foreground cursor-move", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", ...provided.dragHandleProps, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h5", { className: "font-medium text-foreground", children: reading.resourceTitle }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("select", { value: reading.readingType, onChange: (e) => handleUpdateReading(selectedTopic.id, reading.id, { readingType: e.target.value }), className: "text-xs px-2 py-1 border border-input bg-background rounded focus:outline-none focus:ring-1 focus:ring-primary", children: [_jsx("option", { value: "required", children: "Required" }), _jsx("option", { value: "further", children: "Further" }), _jsx("option", { value: "optional", children: "Optional" })] }), _jsx("button", { onClick: () => handleRemoveReading(selectedTopic.id, reading.id), className: "text-red-600 hover:text-red-700", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] })] }), reading.notes && (_jsx("p", { className: "text-sm text-muted-foreground mt-2", children: reading.notes }))] })] }) }) })) }, reading.id))), droppableProvided.placeholder] })) }) })) : (_jsxs("div", { className: "text-center py-8 border-2 border-dashed border-border rounded-lg", children: [_jsx("div", { className: "w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx("svg", { className: "w-6 h-6 text-muted-foreground", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }) }) }), _jsx("p", { className: "text-sm text-muted-foreground", children: "No readings assigned yet. Add your first reading below." })] }))] }), _jsxs("div", { className: "border-t border-border pt-6", children: [_jsx("h4", { className: "font-medium text-foreground mb-4", children: "Add New Reading" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Select Resource" }), _jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => setShowResourceSelector(!showResourceSelector), className: "w-full px-3 py-2 border border-input bg-background rounded-md text-sm text-left flex items-center justify-between hover:border-primary/50 transition-colors", children: [_jsx("span", { className: readingForm.resourceTitle ? 'text-foreground' : 'text-muted-foreground', children: readingForm.resourceTitle || 'Select a resource...' }), _jsx("svg", { className: "w-4 h-4 text-muted-foreground", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }), showResourceSelector && (_jsxs("div", { className: "absolute top-full left-0 right-0 mt-1 z-10 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-hidden", children: [_jsx("div", { className: "p-2 bg-background", children: _jsx("input", { type: "text", value: resourceSearch, onChange: (e) => setResourceSearch(e.target.value), placeholder: "Search resources...", className: "w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" }) }), _jsx("div", { className: "max-h-48 overflow-y-auto bg-background", children: resourcesLoading ? (_jsx("div", { className: "p-4 text-center text-sm text-muted-foreground", children: "Loading resources..." })) : filteredResources.length > 0 ? (_jsx("div", { className: "py-1", children: filteredResources.map((resource) => (_jsxs("button", { type: "button", onClick: () => handleSelectResource(resource), className: "block w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors", children: [_jsx("div", { className: "font-medium text-foreground", children: resource.title }), resource.author && (_jsx("div", { className: "text-xs text-muted-foreground", children: resource.author }))] }, resource.id))) })) : (_jsx("div", { className: "p-4 text-center text-sm text-muted-foreground", children: resourceSearch ? 'No resources found' : 'No resources available' })) })] }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-foreground mb-2", children: "Reading Type" }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: [
                                                    { value: 'required', label: 'Required', description: 'Must be completed' },
                                                    { value: 'further', label: 'Further', description: 'Additional learning' },
                                                    { value: 'optional', label: 'Optional', description: 'Extra resources' }
                                                ].map((type) => (_jsxs("label", { className: "relative flex cursor-pointer rounded-lg border p-3 hover:bg-accent/50 transition-colors", children: [_jsx("input", { type: "radio", name: "reading-type", value: type.value, checked: readingForm.readingType === type.value, onChange: (e) => setReadingForm({
                                                                ...readingForm,
                                                                readingType: e.target.value
                                                            }), className: "sr-only" }), _jsxs("div", { className: "flex-1 text-center", children: [_jsx("div", { className: `text-sm font-medium ${readingForm.readingType === type.value ? 'text-primary' : 'text-foreground'}`, children: type.label }), _jsx("div", { className: "text-xs text-muted-foreground mt-1", children: type.description })] })] }, type.value))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "reading-notes", className: "block text-sm font-medium text-foreground mb-2", children: "Notes (optional)" }), _jsx("textarea", { id: "reading-notes", value: readingForm.notes, onChange: (e) => setReadingForm({ ...readingForm, notes: e.target.value }), placeholder: "Add any notes or instructions for this reading...", rows: 3, className: "w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" })] }), _jsx("button", { onClick: handleAddReading, disabled: !readingForm.resourceId, className: "w-full px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: "Add Reading to Topic" })] })] })] })), _jsxs("div", { className: "bg-muted/50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-foreground mb-2", children: "Reading Summary" }), _jsxs("div", { className: "text-sm text-muted-foreground space-y-1", children: [_jsxs("div", { children: ["Total readings: ", getTotalReadingsCount()] }), _jsxs("div", { children: ["Topics with readings: ", data.topics.filter(t => t.readings.length > 0).length, " / ", data.topics.length] }), _jsxs("div", { children: ["Has required readings: ", hasRequiredReadings() ? 'Yes' : 'No'] })] })] })] }));
}
