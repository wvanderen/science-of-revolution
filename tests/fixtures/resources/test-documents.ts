/**
 * Test Resource Fixtures for Reader Progress Testing
 *
 * This file provides comprehensive test fixtures for different document types,
 * sizes, and structures to support E2E testing of reader progress functionality.
 */

export interface TestSection {
  id: string
  title: string
  content: string
  estimatedReadTime: number // in minutes
}

export interface TestResourceFixture {
  id: string
  title: string
  content: string
  sections: TestSection[]
  metadata: {
    size: 'small' | 'medium' | 'large'
    estimatedReadTime: number
    complexity: 'simple' | 'moderate' | 'complex'
    wordCount: number
    screenCount: number
  }
}

export interface TestProgressData {
  userId: string
  resourceId: string
  scrollPercent: number
  status: 'not_started' | 'in_progress' | 'completed'
  timestamp: string
  lastPosition?: {
    x: number
    y: number
  }
  readingTime?: number // in minutes
}

/**
 * Small Document Fixture - Single screen, no scrolling required
 */
export const smallDocumentFixture: TestResourceFixture = {
  id: 'test-doc-small-001',
  title: 'Introduction to Reader Progress Testing',
  content: `
# Introduction to Reader Progress Testing

This is a small document fixture designed for testing reader progress functionality
with content that fits on a single screen without requiring scrolling.

## Purpose

The small document fixture is used to test:
- Initial progress tracking state
- Component mounting without scroll events
- Basic progress validation
- Memory usage with minimal content

## Content Structure

This document contains approximately 200 words of content, which should display
comfortably on most modern screens without requiring vertical scrolling. The content
includes headings, paragraphs, and basic formatting to simulate real-world documents.

## Testing Scenarios

Use this fixture to test:
1. Component initialization with no scroll
2. Progress state management
3. Basic functionality validation
4. Performance baseline measurement

This content is carefully crafted to provide enough substance for meaningful testing
while remaining compact enough to fit on a single viewport.
  `.trim(),
  sections: [
    {
      id: 'section-1',
      title: 'Introduction',
      content: 'This is a small document fixture designed for testing reader progress functionality.',
      estimatedReadTime: 1
    },
    {
      id: 'section-2',
      title: 'Purpose',
      content: 'The small document fixture is used to test initial progress tracking state.',
      estimatedReadTime: 1
    },
    {
      id: 'section-3',
      title: 'Content Structure',
      content: 'This document contains approximately 200 words of content.',
      estimatedReadTime: 1
    }
  ],
  metadata: {
    size: 'small',
    estimatedReadTime: 3,
    complexity: 'simple',
    wordCount: 200,
    screenCount: 1
  }
}

/**
 * Medium Document Fixture - 2-3 screens, moderate scrolling
 */
export const mediumDocumentFixture: TestResourceFixture = {
  id: 'test-doc-medium-001',
  title: 'Comprehensive Guide to Reader Progress Implementation',
  content: `
# Comprehensive Guide to Reader Progress Implementation

## Chapter 1: Understanding Reader Progress Tracking

Reader progress tracking is a critical feature for modern reading applications.
It allows users to seamlessly continue their reading experience across devices and
sessions, providing a consistent and user-friendly experience.

### What is Reader Progress?

Reader progress refers to the user's current position within a document or text.
This includes both the scroll position and the relative progress through the content.
Effective progress tracking must account for various factors:

- **Scroll Position**: The exact pixel position the user has scrolled to
- **Progress Percentage**: The relative position (0-100%) through the document
- **Reading Session Data**: Information about when the user was last reading
- **Device Context**: Different devices may have different viewport sizes

### Technical Implementation

The implementation of reader progress tracking involves several key components:

#### Intersection Observer API

Modern browsers provide the Intersection Observer API, which allows efficient monitoring
of element visibility within the viewport. This is particularly useful for:
- Tracking when specific sections come into view
- Determining reading progress based on content visibility
- Optimizing performance by avoiding scroll event listeners

#### Scroll Event Handling

For more granular progress tracking, scroll event listeners can be used:
- Real-time position updates during scrolling
- Smooth progress animations
- Immediate feedback on user interactions

#### Data Persistence

Progress data must be persisted reliably:
- Local storage for immediate session persistence
- Remote storage for cross-device synchronization
- Conflict resolution for multi-device scenarios

## Chapter 2: Performance Considerations

### Memory Management

Efficient memory management is crucial for reader progress tracking:
- Event listener cleanup to prevent memory leaks
- Throttling scroll events to reduce computational overhead
- Optimizing Intersection Observer usage

### Large Document Handling

For large documents (books, long articles), special considerations apply:
- Virtual scrolling techniques
- Progressive content loading
- Efficient position calculation algorithms

## Chapter 3: User Experience Design

### Progress Indicators

Visual feedback is essential for user engagement:
- Progress bars showing completion percentage
- Section indicators for multi-part content
- Reading time estimates and bookmarks

### Restoration Behavior

When users return to content, the restoration behavior must be intuitive:
- Smooth scrolling to previous position
- Context preservation (zoom level, viewing mode)
- Graceful handling of content changes

This comprehensive guide covers the essential aspects of implementing robust
reader progress functionality in modern web applications.
  `.trim(),
  sections: [
    {
      id: 'section-1',
      title: 'Understanding Reader Progress Tracking',
      content: 'Reader progress tracking is a critical feature for modern reading applications.',
      estimatedReadTime: 2
    },
    {
      id: 'section-2',
      title: 'What is Reader Progress?',
      content: 'Reader progress refers to the user\'s current position within a document.',
      estimatedReadTime: 3
    },
    {
      id: 'section-3',
      title: 'Technical Implementation',
      content: 'The implementation involves Intersection Observer API and scroll event handling.',
      estimatedReadTime: 4
    },
    {
      id: 'section-4',
      title: 'Performance Considerations',
      content: 'Memory management and large document handling are crucial.',
      estimatedReadTime: 3
    },
    {
      id: 'section-5',
      title: 'User Experience Design',
      content: 'Progress indicators and restoration behavior enhance user experience.',
      estimatedReadTime: 3
    }
  ],
  metadata: {
    size: 'medium',
    estimatedReadTime: 15,
    complexity: 'moderate',
    wordCount: 800,
    screenCount: 2.5
  }
}

/**
 * Large Document Fixture - 10+ screens, extensive scrolling
 */
export const largeDocumentFixture: TestResourceFixture = {
  id: 'test-doc-large-001',
  title: 'The Complete History of Digital Reading Technologies',
  content: `
# The Complete History of Digital Reading Technologies

## Preface

The evolution of digital reading technologies represents one of the most significant
transformations in how humans consume and interact with written content. From the early
days of digital text displays to modern e-readers and web-based reading platforms,
the journey has been marked by continuous innovation and adaptation to user needs.

This comprehensive document explores the technical, social, and cultural aspects of
digital reading, providing insights into both historical developments and future trends.

---

## Chapter 1: The Dawn of Digital Text (1940s-1970s)

### Early Computing and Text Display

The foundations of digital reading were laid in the era of room-sized computers.
In 1945, Vannevar Bush envisioned the "Memex," a device that would allow users
to browse through and store extensive amounts of information. While never built,
this concept influenced decades of research into hypertext and digital information systems.

### The First Text Editors

The 1960s saw the development of the first text editors, which were revolutionary
for their time. Systems like TECO (Text Editor and Corrector) and later Emacs
allowed users to manipulate digital text in ways that were previously impossible.

### Hypertext Systems

Ted Nelson coined the term "hypertext" in 1965, describing non-linear text navigation.
His Xanadu project, though never fully realized, introduced concepts that would become
fundamental to the World Wide Web decades later.

## Chapter 2: The Personal Computer Revolution (1980s)

### Early Word Processors

The 1980s brought computing into homes and offices, along with sophisticated word
processing software. Programs like WordPerfect and Microsoft Word transformed how
people created and consumed digital text.

### CD-ROM Technology

The introduction of CD-ROMs in the mid-1980s enabled the distribution of large
amounts of digital text. Encyclopedias, reference works, and literary collections
became available in digital format for the first time.

### Early E-Readers

The Sony Bookman, released in 1990, was one of the first dedicated electronic book
devices. While primitive by modern standards, it established the concept of portable
digital reading.

## Chapter 3: The Internet Age (1990s)

### The World Wide Web

Tim Berners-Lee's invention of the World Wide Web in 1991 revolutionized digital
reading. HTML provided a standardized way to structure text, while web browsers
made it accessible to millions.

### Online Libraries and Archives

Projects like Project Gutenberg (founded 1971 but gained prominence in the 1990s)
began digitizing public domain books, making them freely available online.

### Early Web Reading

Web-based reading evolved from simple text displays to sophisticated layouts with
images, multimedia, and interactive elements. This period saw the development of
many conventions we still use today.

## Chapter 4: The E-Reader Revolution (2000s)

### The Sony Librie

Released in 2004, the Sony Librie was the first commercial e-reader using electronic
ink (E Ink) technology. It offered a paper-like reading experience with minimal eye strain.

### The Amazon Kindle

The 2007 launch of the Amazon Kindle transformed the e-book market. Its combination
of E Ink display, wireless connectivity, and integrated bookstore made e-reading
accessible to mainstream consumers.

### The iPad and Tablets

Apple's 2010 iPad launch introduced tablet computing to the masses. While not
specialized e-readers, tablets offered versatile reading experiences with color
displays and multimedia capabilities.

## Chapter 5: Modern Reading Technologies (2010s-Present)

### Advanced E-Readers

Modern e-readers feature high-resolution displays, adjustable lighting, and
waterproof designs. Devices like the Kindle Oasis and Kobo Forma offer premium
reading experiences.

### Web-Based Reading Platforms

Services like Medium, Substack, and various news platforms have created sophisticated
web-based reading experiences with features like reading time estimates, progress
tracking, and social engagement.

### Mobile Reading

Smartphones have become primary reading devices for many people. Apps like Kindle,
Apple Books, and Google Play Books synchronize reading progress across devices.

## Chapter 6: Technical Innovations

### Reading Progress Tracking

Modern reading platforms track user progress through content, enabling seamless
device switching and intelligent recommendations.

### Typography and Layout

Advances in web typography and responsive design have improved readability across
devices and screen sizes.

### Accessibility Features

Text-to-speech, adjustable font sizes, and high-contrast modes make digital reading
accessible to users with various needs.

## Chapter 7: Future Trends

### Artificial Intelligence Integration

AI-powered features like automated summaries, intelligent recommendations, and
personalized reading experiences are becoming increasingly sophisticated.

### Augmented Reality Reading

AR technologies promise to blend digital and physical reading experiences in novel ways.

### Sustainable Reading

Digital reading continues to evolve with increasing focus on energy efficiency and
environmental sustainability.

## Conclusion

The history of digital reading technologies reflects broader trends in computing
and human-computer interaction. From simple text displays to sophisticated reading
platforms, each advancement has brought us closer to seamless, intuitive digital
reading experiences.

As we look to the future, emerging technologies promise to further transform how
we create, distribute, and consume written content. The journey of digital reading
is far from over—it continues to evolve with each technological advancement and
changing user needs.

---

## Epilogue

This comprehensive history demonstrates that digital reading is not merely a
technological phenomenon but a cultural one. It has changed how we learn,
communicate, and preserve knowledge. As we continue to innovate, we must remember
that the ultimate goal remains the same: to make knowledge accessible and enjoyable
for all readers, regardless of their circumstances or preferences.

The future of digital reading brightens with each passing day, promising experiences
we can barely imagine today, built upon the foundations laid by decades of innovation.
  `.trim(),
  sections: [
    {
      id: 'section-1',
      title: 'Preface',
      content: 'The evolution of digital reading technologies represents a significant transformation.',
      estimatedReadTime: 3
    },
    {
      id: 'section-2',
      title: 'The Dawn of Digital Text',
      content: 'The foundations were laid in the era of room-sized computers.',
      estimatedReadTime: 5
    },
    {
      id: 'section-3',
      title: 'The Personal Computer Revolution',
      content: 'The 1980s brought computing into homes and offices.',
      estimatedReadTime: 4
    },
    {
      id: 'section-4',
      title: 'The Internet Age',
      content: 'The World Wide Web revolutionized digital reading in 1991.',
      estimatedReadTime: 4
    },
    {
      id: 'section-5',
      title: 'The E-Reader Revolution',
      content: 'The 2007 Kindle launch transformed the e-book market.',
      estimatedReadTime: 4
    },
    {
      id: 'section-6',
      title: 'Modern Reading Technologies',
      content: 'Modern e-readers feature high-resolution displays and advanced features.',
      estimatedReadTime: 4
    },
    {
      id: 'section-7',
      title: 'Technical Innovations',
      content: 'Progress tracking and typography advances have improved readability.',
      estimatedReadTime: 3
    },
    {
      id: 'section-8',
      title: 'Future Trends',
      content: 'AI integration and AR promise new reading experiences.',
      estimatedReadTime: 3
    },
    {
      id: 'section-9',
      title: 'Conclusion',
      content: 'Digital reading continues to evolve with technological advancement.',
      estimatedReadTime: 2
    },
    {
      id: 'section-10',
      title: 'Epilogue',
      content: 'Digital reading is a cultural phenomenon that has changed how we learn.',
      estimatedReadTime: 2
    }
  ],
  metadata: {
    size: 'large',
    estimatedReadTime: 34,
    complexity: 'complex',
    wordCount: 3000,
    screenCount: 12
  }
}

/**
 * Test Progress Data Fixtures
 */
export const testProgressFixtures: TestProgressData[] = [
  {
    userId: 'test-user-001',
    resourceId: 'test-doc-small-001',
    scrollPercent: 0,
    status: 'not_started',
    timestamp: '2025-10-19T10:00:00Z'
  },
  {
    userId: 'test-user-002',
    resourceId: 'test-doc-medium-001',
    scrollPercent: 0.25,
    status: 'in_progress',
    timestamp: '2025-10-19T11:30:00Z',
    lastPosition: { x: 0, y: 400 },
    readingTime: 5
  },
  {
    userId: 'test-user-003',
    resourceId: 'test-doc-large-001',
    scrollPercent: 0.75,
    status: 'in_progress',
    timestamp: '2025-10-19T14:15:00Z',
    lastPosition: { x: 0, y: 2400 },
    readingTime: 25
  },
  {
    userId: 'test-user-004',
    resourceId: 'test-doc-medium-001',
    scrollPercent: 1.0,
    status: 'completed',
    timestamp: '2025-10-19T09:45:00Z',
    lastPosition: { x: 0, y: 800 },
    readingTime: 15
  }
]

/**
 * All test fixtures indexed by ID for easy access
 */
export const testFixtures: Record<string, TestResourceFixture> = {
  [smallDocumentFixture.id]: smallDocumentFixture,
  [mediumDocumentFixture.id]: mediumDocumentFixture,
  [largeDocumentFixture.id]: largeDocumentFixture
}

/**
 * Get fixture by size category
 */
export function getFixturesBySize(size: 'small' | 'medium' | 'large'): TestResourceFixture[] {
  return Object.values(testFixtures).filter(fixture => fixture.metadata.size === size)
}

/**
 * Get fixtures by complexity level
 */
export function getFixturesByComplexity(complexity: 'simple' | 'moderate' | 'complex'): TestResourceFixture[] {
  return Object.values(testFixtures).filter(fixture => fixture.metadata.complexity === complexity)
}