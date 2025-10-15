import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { usePlanTopics, useCreateTopic, useUpdateTopic, useDeleteTopic, useReorderTopics } from '../hooks/usePlanTopics';
import { useAnalytics } from '../../../lib/analytics';
/**
 * Topic management interface for facilitators
 * Allows creating, editing, reordering, and deleting topics
 */
export function TopicManager({ planId, onTopicSelect }) {
    const { data: topics, isLoading } = usePlanTopics(planId);
    const createTopic = useCreateTopic();
    const updateTopic = useUpdateTopic();
    const deleteTopic = useDeleteTopic();
    const reorderTopics = useReorderTopics();
    const { trackInteraction } = useAnalytics();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTopicId, setEditingTopicId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        estimatedHours: 1,
        isRequired: true
    });
    const handleCreateTopic = async () => {
        if (!formData.title.trim())
            return;
        try {
            await createTopic.mutateAsync({
                educationPlanId: planId,
                title: formData.title,
                description: formData.description || undefined,
                estimatedHours: formData.estimatedHours,
                isRequired: formData.isRequired
            });
            setFormData({
                title: '',
                description: '',
                estimatedHours: 1,
                isRequired: true
            });
            setShowAddForm(false);
            trackInteraction('topic_manager', 'topic_created', { planId });
        }
        catch (error) {
            console.error('Failed to create topic:', error);
        }
    };
    const handleUpdateTopic = async (topicId) => {
        if (!formData.title.trim())
            return;
        try {
            await updateTopic.mutateAsync({
                id: topicId,
                data: {
                    title: formData.title,
                    description: formData.description || undefined,
                    estimatedHours: formData.estimatedHours,
                    isRequired: formData.isRequired
                }
            });
            setEditingTopicId(null);
            setFormData({
                title: '',
                description: '',
                estimatedHours: 1,
                isRequired: true
            });
            trackInteraction('topic_manager', 'topic_updated', { topicId, planId });
        }
        catch (error) {
            console.error('Failed to update topic:', error);
        }
    };
    const handleDeleteTopic = async (topicId) => {
        if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
            return;
        }
        try {
            await deleteTopic.mutateAsync(topicId);
            trackInteraction('topic_manager', 'topic_deleted', { topicId, planId });
        }
        catch (error) {
            console.error('Failed to delete topic:', error);
        }
    };
    const handleStartEdit = (topic) => {
        setEditingTopicId(topic.id);
        setFormData({
            title: topic.title,
            description: topic.description || '',
            estimatedHours: topic.estimated_hours || 1,
            isRequired: topic.is_required
        });
    };
    const handleCancelEdit = () => {
        setEditingTopicId(null);
        setShowAddForm(false);
        setFormData({
            title: '',
            description: '',
            estimatedHours: 1,
            isRequired: true
        });
    };
    const handleReorder = async (result) => {
        if (!result.destination || !topics)
            return;
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        if (sourceIndex === destinationIndex)
            return;
        // Optimistically update UI
        const reorderedTopics = [...topics];
        const [removed] = reorderedTopics.splice(sourceIndex, 1);
        reorderedTopics.splice(destinationIndex, 0, removed);
        // Get the topic IDs in new order
        const topicIds = reorderedTopics.map(t => t.id);
        try {
            await reorderTopics.mutateAsync({ planId, topicIds });
            trackInteraction('topic_manager', 'topics_reordered', { planId, totalTopics: topics.length });
        }
        catch (error) {
            console.error('Failed to reorder topics:', error);
        }
    };
    if (isLoading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "h-10 bg-muted rounded animate-pulse" }), [1, 2, 3].map((i) => (_jsx("div", { className: "h-24 bg-card border border-border rounded-lg animate-pulse" }, i)))] }));
    }
    const sortedTopics = topics ? [...topics].sort((a, b) => a.order_index - b.order_index) : [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-foreground", children: "Manage Topics" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Create and organize learning topics for this education plan" })] }), !showAddForm && (_jsx("button", { onClick: () => setShowAddForm(true), className: "px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors", children: "+ Add Topic" }))] }), showAddForm && (_jsxs("div", { className: "bg-card border border-border rounded-lg p-6", children: [_jsx("h3", { className: "font-medium text-foreground mb-4", children: "Add New Topic" }), _jsx(TopicForm, { formData: formData, onChange: setFormData, onSubmit: handleCreateTopic, onCancel: handleCancelEdit, isSubmitting: createTopic.isPending, submitLabel: "Create Topic" })] })), sortedTopics.length === 0 ? (_jsxs("div", { className: "bg-muted/50 border-2 border-dashed border-border rounded-lg p-12 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-muted-foreground", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }) }), _jsx("h3", { className: "text-lg font-medium text-foreground mb-2", children: "No topics yet" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Get started by adding your first topic to this education plan." }), _jsx("button", { onClick: () => setShowAddForm(true), className: "px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors", children: "Add First Topic" })] })) : (_jsx(DragDropContext, { onDragEnd: handleReorder, children: _jsx(Droppable, { droppableId: "topics", children: (provided) => (_jsxs("div", { ...provided.droppableProps, ref: provided.innerRef, className: "space-y-3", children: [sortedTopics.map((topic, index) => (_jsx(Draggable, { draggableId: topic.id, index: index, children: (provided, snapshot) => (_jsx("div", { ref: provided.innerRef, ...provided.draggableProps, className: `
                          bg-card border border-border rounded-lg transition-shadow
                          ${snapshot.isDragging ? 'shadow-lg' : ''}
                        `, children: editingTopicId === topic.id ? (_jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "font-medium text-foreground mb-4", children: "Edit Topic" }), _jsx(TopicForm, { formData: formData, onChange: setFormData, onSubmit: () => handleUpdateTopic(topic.id), onCancel: handleCancelEdit, isSubmitting: updateTopic.isPending, submitLabel: "Save Changes" })] })) : (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { ...provided.dragHandleProps, className: "mt-1 cursor-move text-muted-foreground hover:text-foreground", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsxs("span", { className: "text-sm font-medium text-muted-foreground", children: ["#", index + 1] }), _jsx("h3", { className: "font-semibold text-foreground", children: topic.title }), topic.is_required && (_jsx("span", { className: "inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded", children: "Required" }))] }), topic.description && (_jsx("p", { className: "text-sm text-muted-foreground mb-3", children: topic.description })), _jsx("div", { className: "flex items-center space-x-4 text-xs text-muted-foreground", children: topic.estimated_hours && (_jsxs("span", { children: [topic.estimated_hours, "h estimated"] })) })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => onTopicSelect?.(topic.id), className: "p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors", title: "Manage readings", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" }) }) }), _jsx("button", { onClick: () => handleStartEdit(topic), className: "p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors", title: "Edit topic", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }) }) }), _jsx("button", { onClick: () => handleDeleteTopic(topic.id), className: "p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors", title: "Delete topic", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) }) })] })] }) })) })) }, topic.id))), provided.placeholder] })) }) }))] }));
}
/**
 * Reusable topic form component
 */
function TopicForm({ formData, onChange, onSubmit, onCancel, isSubmitting, submitLabel }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "topic-title", className: "block text-sm font-medium text-foreground mb-2", children: "Title *" }), _jsx("input", { id: "topic-title", type: "text", value: formData.title, onChange: (e) => onChange({ ...formData, title: e.target.value }), placeholder: "e.g., Introduction to Revolutionary Theory", className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", disabled: isSubmitting })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "topic-description", className: "block text-sm font-medium text-foreground mb-2", children: "Description" }), _jsx("textarea", { id: "topic-description", value: formData.description, onChange: (e) => onChange({ ...formData, description: e.target.value }), placeholder: "Provide a brief overview of what learners will cover in this topic...", rows: 3, className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none", disabled: isSubmitting })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "topic-hours", className: "block text-sm font-medium text-foreground mb-2", children: "Estimated Hours" }), _jsx("input", { id: "topic-hours", type: "number", min: "0.5", step: "0.5", value: formData.estimatedHours, onChange: (e) => onChange({ ...formData, estimatedHours: parseFloat(e.target.value) }), className: "w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", disabled: isSubmitting })] }), _jsx("div", { children: _jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: formData.isRequired, onChange: (e) => onChange({ ...formData, isRequired: e.target.checked }), className: "rounded border-input", disabled: isSubmitting }), _jsx("span", { className: "text-sm text-foreground", children: "This is a required topic" })] }) }), _jsxs("div", { className: "flex items-center justify-end space-x-3 pt-4 border-t border-border", children: [_jsx("button", { onClick: onCancel, disabled: isSubmitting, className: "px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors", children: "Cancel" }), _jsx("button", { onClick: onSubmit, disabled: isSubmitting || !formData.title.trim(), className: "px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: isSubmitting ? 'Saving...' : submitLabel })] })] }));
}
