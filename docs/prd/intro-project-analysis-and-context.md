# Intro Project Analysis and Context

## Existing Project Overview

**Analysis Source:** IDE-based fresh analysis using existing brownfield architecture document

**Current Project State:**
Science of Revolution is a mobile-friendly, gamified social reading platform for Marxist study materials, built with React 18.3.1, TypeScript 5.5.4, Vite, Tailwind CSS, and Supabase backend. The platform features collaborative annotation, progress tracking, and educational path management with a well-architected feature-based organization.

The application is feature-complete and well-structured overall, but has one critical technical debt blocker: the Reader component (`ReaderPage.tsx` at 1,127 lines) is a monolithic "God component" that violates architectural principles and poses a significant risk for launch stability.

## Available Documentation Analysis

**Available Documentation:**
- ✅ Tech Stack Documentation (from brownfield architecture)
- ✅ Source Tree/Architecture (comprehensive)
- ✅ Coding Standards (partial, in dev files)
- ✅ API Documentation (Supabase integration)
- ✅ External API Documentation (covered)
- ✅ Technical Debt Documentation (extensive)
- ✅ Brownfield Architecture Analysis (excellent)

## Enhancement Scope Definition

**Enhancement Type:** Major Feature Modification + UI/UX Overhaul

**Enhancement Description:** Complete re-architecture of the monolithic Reader component into focused, maintainable components while preserving all existing functionality, plus implementation of new launch features including user profiles, shared notes, and cohort management.

**Impact Assessment:** Major Impact (architectural changes required)

## Goals and Background Context

**Goals:**
- Decompose 1,127-line ReaderPage.tsx into focused, single-responsibility components
- Implement user profile configuration system with avatar management
- Add shared notes functionality for collaborative reading experiences
- Create cohort management system for facilitators and members
- Maintain 100% backward compatibility of existing user features
- Improve code maintainability and testability for future development

**Background Context:**
The Reader component has grown organically into a monolithic structure that handles reading, progress tracking, navigation, highlighting, keyboard shortcuts, and preferences all in one component. This violates single responsibility principle and makes the codebase fragile. While the feature set is complete and working well for users, the technical debt prevents a stable launch and limits future feature development.

Additionally, several key features are needed for launch: user profile configuration to personalize the reading experience, shared notes to enable collaborative learning, and cohort management to support educational group activities.

## Change Log

| Change | Date | Version | Description | Author |
| ------ | ---- | ------- | ----------- | ------ |
| Initial PRD Creation | 2025-10-18 | 1.0 | Brownfield enhancement PRD for Reader component re-architecture and launch features | John (PM) |
