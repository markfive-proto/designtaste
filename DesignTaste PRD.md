# DesignTaste PRD

**Product Requirements Document (PRD): Vibe UI Assistant**

---

**Product Name:** Vibe UI Assistant

**Goal:** Help vibe coders improve the quality of their UI/UX by allowing them to screenshot a section of a web page, find high-quality design inspiration, and receive AI-generated code improvements using Tailwind or HTML.

---

### **1.**

### **Overview**

Vibe UI Assistant is a browser-based tool (initially a Chrome extension) that allows users to select a section of any website they are working on, capture the UI block, and receive a list of inspirational UI designs along with tailored code improvement suggestions.

---

### **2.**

### **Target Users**

- Indie developers and vibe coders
- Designers who code
- UX/UI learners
- Frontend developers building MVPs

---

### **3.**

### **Core Features**

### **a. UI Block Selection & Queue Management**

- Let user select a section of the webpage via click and highlight
- Capture DOM + bounding box + screenshot of selected element
- **Background Processing**: Option to add elements to processing queue
- **Multi-Selection**: Select multiple elements across different pages
- **Queue Management**: View, prioritize, and manage queued elements

### **b. Parallel AI Analysis**

- **Background Processing**: Each queued element processed simultaneously
- Send screenshot to Vision AI (e.g. GPT-4 Vision)
- Extract component type (e.g. hero section, card, form)
- Analyze spacing, contrast, alignment, hierarchy
- **Real-time Updates**: WebSocket notifications for processing status
- **Cross-Element Learning**: Identify patterns across multiple selections

### **c. Parallel Inspiration Search**

- **Concurrent Processing**: Each element gets simultaneous inspiration search
- Query Mobbin API (or local vector DB) for similar UI examples
- **Smart Filtering**: Learn from user preferences across elements
- Display scrollable gallery of inspirational components per element
- **Batch Discovery**: Find cohesive design systems across multiple elements

### **d. Prompt Generator**

- Generate prompt using:
    - Detected component type
    - User-selected inspiration
    - Style preferences (e.g. minimalist, dark mode, rounded)

### **e. Code Output**

- Use GPT-4 or Claude to generate Tailwind or HTML code
- Allow copy-paste or GitHub/Gist export
- Future: Inject code via Cursor/VSCode plugin

### **f. Feedback Loop**

- Let user rate: “Was this helpful?” + why
- Store for future RAG fine-tuning

---

### **4.**

### **User Stories**

**As a vibe coder**, I want to highlight a part of my UI that feels weak so that I can get suggestions to improve it.

**As a designer who codes**, I want to find beautiful examples of similar components so that I can match the quality of my design.

**As a frontend developer**, I want to copy optimized Tailwind code that improves spacing and hierarchy without guessing.

**As a beginner**, I want to see side-by-side comparisons of my design and a better one so I can learn visually.

**As a busy developer**, I want to select multiple UI elements and let them process in the background while I continue working, so I can batch-review improvements later.

**As a design-conscious coder**, I want to analyze my entire website systematically and receive suggestions for a cohesive design system across all components.

---

### **5.**

### **Tech Stack**

### **Frontend**

- **Next.js 14** with App Router for main application
- **React 18** with TypeScript for component architecture
- **TailwindCSS** for styling system
- **Framer Motion** for smooth animations and transitions
- **Magic UI** for enhanced component library
- **Chrome Extension (Manifest v3)** for browser integration

### **Backend/API & Authentication**

- **Next.js API Routes** for backend services
- **Supabase** for authentication, database, and user management
- **OpenAI GPT-4 Vision / Claude** for AI reasoning and code generation
- **Vector DB**: Chroma or Weaviate for RAG on inspiration examples
- **Mobbin API** or scraped dataset for design inspiration

### **Optional Integrations**

- Cursor plugin (code injection)
- GitHub Gist sharing

---

### **6.**

### **Milestones**

| **Week** | **Milestone** |
| --- | --- |
| 1-2 | UI selection + screenshot capture + background queue system |
| 2-3 | GPT Vision + parallel processing + real-time updates |
| 3-4 | Multi-element inspiration gallery + batch operations |
| 4-5 | Code generation + design system consistency + export options |
| 6 | MVP test with multi-element workflows + feedback iteration |

---

### **7.**

### **Future Enhancements**

- Style memory: persistent themes (e.g. modern, playful, brutalist)
- Figma plugin version
- Full AI co-designer panel with drag-to-replace components
- Slack/Telegram bot for async reviews

---

### **8.**

### **Success Metrics**

- Time-to-improvement: How fast users go from selection to better output
- User satisfaction scores on AI suggestions
- Retention: repeat usage of tool across projects
- Number of component inspirations viewed per session
- Code copied/shared/exported per session