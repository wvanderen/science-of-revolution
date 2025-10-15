import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAnalytics } from '../../../../lib/analytics';
/**
 * Topics step of the plan wizard - create and organize learning topics
 */
export function TopicsStep({ data, onChange, onNext, onBack, onCancel }) {
    const [editingTopic, setEditingTopic] = useState(null);
    const [topicForm, setTopicForm] = useState({
        title: '',
        description: '',
        estimatedHours: 4,
        isRequired: true
    });
    const { trackInteraction } = useAnalytics();
    const handleAddTopic = () => {
        if (topicForm.title.trim() === '')
            return;
        const newTopic = {
            ...topicForm,
            id: Date.now().toString(),
            orderIndex: data.topics.length
        };
        onChange({
            topics: [...data.topics, { ...newTopic, orderIndex: newTopic.orderIndex, readings: [] }]
        });
        setTopicForm({
            title: '',
            description: '',
            estimatedHours: 4,
            isRequired: true
        });
        setEditingTopic(null);
        trackInteraction('topics_step', 'add_topic', {
            topicTitle: topicForm.title,
            isRequired: topicForm.isRequired
        });
    };
    const handleUpdateTopic = (topicId, updates) => {
        onChange({
            topics: data.topics.map(topic => topic.id === topicId ? { ...topic, ...updates } : topic)
        });
        if (updates.title !== undefined) {
            trackInteraction('topics_step', 'update_topic', {
                topicId,
                field: 'title',
                oldValue: data.topics.find(t => t.id === topicId)?.title,
                newValue: updates.title
            });
        }
    };
    const handleDeleteTopic = (topicId) => {
        const topic = data.topics.find(t => t.id === topicId);
        if (topic) {
            onChange({
                topics: data.topics.filter(t => t.id !== topicId)
            });
            trackInteraction('topics_step', 'delete_topic', {
                topicId,
                topicTitle: topic.title
            });
        }
    };
    const handleToggleRequired = (topicId) => {
        const topic = data.topics.find(t => t.id === topicId);
        if (topic) {
            handleUpdateTopic(topicId, { isRequired: !topic.isRequired });
        }
    };
    const handleEditTopic = (topicId) => {
        const topic = data.topics.find(t => t.id === topicId);
        if (topic) {
            setEditingTopic(topicId);
            setTopicForm({
                title: topic.title,
                description: topic.description || '',
                estimatedHours: topic.estimatedHours,
                isRequired: topic.isRequired
            });
        }
    };
    const handleSaveEdit = () => {
        if (editingTopic && topicForm.title.trim() !== '') {
            handleUpdateTopic(editingTopic, topicForm);
            setEditingTopic(null);
            setTopicForm({
                title: '',
                description: '',
                estimatedHours: 4,
                isRequired: true
            });
        }
    };
    const handleCancelEdit = () => {
        setEditingTopic(null);
        setTopicForm({
            title: '',
            description: '',
            estimatedHours: 4,
            isRequired: true
        });
    };
    const handleReorder = (result) => {
        if (!result.destination)
            return;
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        // Create a copy of the topics array
        const reorderedTopics = [...data.topics];
        // Remove the dragged topic from its original position
        const [removed] = reorderedTopics.splice(sourceIndex, 1);
        // Insert the dragged topic at its new position
        reorderedTopics.splice(destinationIndex, 0, removed);
        // Update order indices
        const topicsWithNewOrder = reorderedTopics.map((topic, index) => ({
            ...topic,
            orderIndex: index
        }));
        onChange({
            topics: topicsWithNewOrder
        });
        trackInteraction('topics_step', 'reorder_topics', {
            totalTopics: data.topics.length
        });
    };
    // Sort topics by orderIndex for display
    const sortedTopics = [...data.topics].sort((a, b) => a.orderIndex - b.orderIndex);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-foreground", children: "Learning Topics" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Create the main sections of your education plan. Each topic can contain multiple reading assignments." })] }), sortedTopics.length > 0 ? (_jsx("div", { className: "space-y-4", children: _jsx(DragDropContext, { onDragEnd: handleReorder, children: _jsx(Droppable, { droppableId: "topics", children: (provided) => (_jsxs("div", { ...provided.droppableProps, ref: provided.innerRef, className: "space-y-3", children: [sortedTopics.map((topic, index) => (_jsx(Draggable, { draggableId: topic.id, index: index, children: (provided, snapshot) => (_jsx("div", { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps, className: `
                          bg-card border border-border rounded-lg p-4 cursor-move hover:border-primary/50 transition-colors
                          ${snapshot.isDragging ? 'opacity-50' : ''}
                        `, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3 flex-1", children: [_jsx("div", { className: "mt-1", children: _jsx("svg", { className: "w-4 h-4 text-muted-foreground cursor-move", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", ...provided.dragHandleProps, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }), _jsx("div", { className: "flex-1", children: editingTopic === topic.id ? (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: topicForm.title, onChange: (e) => setTopicForm({ ...topicForm, title: e.target.value }), placeholder: "Topic title", className: "w-full px-3 py-1 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", autoFocus: true }), _jsx("textarea", { value: topicForm.description, onChange: (e) => setTopicForm({ ...topicForm, description: e.target.value }), placeholder: "Brief description of what learners will accomplish in this topic", rows: 2, className: "w-full px-3 py-1 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("label", { className: "text-sm text-muted-foreground", children: "Hours:" }), _jsx("input", { type: "number", min: "1", max: "100", value: topicForm.estimatedHours, onChange: (e) => setTopicForm({ ...topicForm, estimatedHours: parseInt(e.target.value) || 4 }), className: "w-16 px-2 py-1 border border-input bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: `required-${topic.id}`, checked: topicForm.isRequired, onChange: (e) => setTopicForm({ ...topicForm, isRequired: e.target.checked }), className: "rounded border-input" }), _jsx("label", { htmlFor: `required-${topic.id}`, className: "text-sm text-muted-foreground", children: "Required" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: handleSaveEdit, disabled: topicForm.title.trim() === '', className: "px-3 py-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed", children: "Save" }), _jsx("button", { onClick: handleCancelEdit, className: "px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground", children: "Cancel" })] })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-medium text-foreground", children: topic.title }), _jsxs("div", { className: "flex items-center space-x-2", children: [topic.isRequired && (_jsx("span", { className: "inline-flex items-center px-2 py-1 text-xs bg-primary/10 text-primary rounded", children: "Required" })), _jsxs("span", { className: "inline-flex items-center px-2 py-1 text-xs bg-muted text-muted-foreground rounded", children: [topic.estimatedHours, "h"] })] })] }), topic.description && (_jsx("p", { className: "text-sm text-muted-foreground", children: topic.description })), _jsxs("div", { className: "flex items-center space-x-2 pt-2", children: [_jsx("button", { onClick: () => handleEditTopic(topic.id), className: "text-xs text-primary hover:text-primary/80 font-medium", children: "Edit" }), _jsx("button", { onClick: () => handleToggleRequired(topic.id), className: "text-xs text-muted-foreground hover:text-foreground", children: topic.isRequired ? 'Make Optional' : 'Make Required' }), _jsx("button", { onClick: () => handleDeleteTopic(topic.id), className: "text-xs text-red-600 hover:text-red-700 font-medium", children: "Delete" })] })] })) })] }), _jsx("div", { className: "flex items-center space-x-2 mt-2", children: !editingTopic && (_jsx("button", { onClick: () => handleDeleteTopic(topic.id), className: "text-red-600 hover:text-red-700 text-sm font-medium", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 011.415-1.415l-5.586-5.586a2 2 0 0 0-1.415-1.415L5 7.586a2 2 0 0 0 0 2.828 0zM9 5v4m0 0L7 7m0 0v-4m0 0l2 2m-2-2v4m0 0h4m-4 0H9z" }) }) })) })] }) })) }, topic.id))), provided.placeholder] })) }) }) })) : (_jsxs("div", { className: "text-center py-12 border-2 border-dashed border-border rounded-lg", children: [_jsx("div", { className: "w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-muted-foreground", fill: "none", stroke: "currentColor", viewBox: "00 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }) }), _jsx("h3", { className: "text-lg font-medium text-foreground mb-2", children: "No topics yet" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Add your first learning topic to get started with your education plan." })] })), _jsx("div", { className: "border-t border-border pt-6", children: _jsxs("div", { className: "bg-muted/50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-foreground mb-4", children: "Add New Topic" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "new-topic-title", className: "block text-sm font-medium text-foreground mb-1", children: "Topic Title *" }), _jsx("input", { id: "new-topic-title", type: "text", value: topicForm.title, onChange: (e) => setTopicForm({ ...topicForm, title: e.target.value }), placeholder: "e.g., Introduction to Marxist Theory", className: "w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", onKeyPress: (e) => {
                                                if (e.key === 'Enter' && topicForm.title.trim() !== '') {
                                                    e.preventDefault();
                                                    handleAddTopic();
                                                }
                                            } })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("label", { htmlFor: "new-topic-hours", className: "text-sm font-medium text-muted-foreground", children: "Hours:" }), _jsx("input", { id: "new-topic-hours", type: "number", min: "1", max: "100", value: topicForm.estimatedHours, onChange: (e) => setTopicForm({ ...topicForm, estimatedHours: parseInt(e.target.value) || 4 }), className: "w-16 px-2 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "new-topic-required", checked: topicForm.isRequired, onChange: (e) => setTopicForm({ ...topicForm, isRequired: e.target.checked }), className: "rounded border-input" }), _jsx("label", { htmlFor: "new-topic-required", className: "text-sm text-muted-foreground", children: "Required topic" })] })] }), _jsx("button", { onClick: handleAddTopic, disabled: topicForm.title.trim() === '', className: "w-full px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: "Add Topic" })] })] }) })] }));
}
