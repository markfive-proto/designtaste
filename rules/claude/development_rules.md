# Claude Development Rules for Vibe UI Assistant

## Project Overview
- **Product:** Vibe UI Assistant - Chrome extension for UI/UX improvement
- **Target:** Indie developers, vibe coders, designers who code, frontend developers
- **Core Function:** Screenshot UI sections → Get design inspiration → Receive AI-generated code improvements

## Core Development Principles

### 1. Simplicity First
- Every change should impact as little code as possible
- Avoid massive or complex changes
- Prioritize minimal, focused implementations
- Keep components small and single-purpose

### 2. Tech Stack Adherence
- **Frontend:** Next.js 14 with App Router, React 18 + TypeScript, TailwindCSS, Framer Motion, Magic UI
- **Chrome Extension:** Manifest v3 for browser integration
- **Backend:** Next.js API Routes
- **Authentication:** Supabase for auth, database, and user management
- **AI:** OpenAI GPT-4 Vision / Claude for code generation
- **Vector DB:** Chroma or Weaviate for inspiration examples
- **API:** Mobbin API for design inspiration

### 3. Feature Implementation Order
Follow the 6-week milestone structure:
1. UI selection + screenshot capture (Weeks 1-2)
2. GPT Vision + prompt generation (Weeks 2-3)
3. Inspiration gallery from Mobbin/DB (Weeks 3-4)
4. Code generation and copy/share interface (Weeks 4-5)
5. MVP test, feedback, and iteration (Week 6)

### 4. Code Generation Standards
- Generate **Tailwind CSS**, **Next.js components**, or **HTML** code
- Use **Magic UI** components when appropriate
- Integrate **Framer Motion** for animations and transitions
- Ensure copy-paste functionality with TypeScript support
- Support GitHub/Gist export
- Focus on spacing, contrast, alignment, hierarchy improvements
- Always provide working, production-ready code with proper imports

### 5. Component Types to Support
- Hero sections
- Cards
- Forms
- Navigation elements
- Buttons and CTAs
- Layout sections

### 6. User Experience Priorities
- **Time-to-improvement:** Fast workflow from selection to better output
- **Visual learning:** Side-by-side comparisons of original vs improved
- **Actionable output:** Code that can be immediately used
- **Inspiration discovery:** High-quality UI examples from Mobbin

### 7. Quality Assurance
- Test Next.js application functionality and routing
- Test Chrome extension integration with main app
- Validate AI-generated code works with Next.js and TypeScript
- Ensure Supabase authentication flows work correctly
- Test Framer Motion animations across different devices
- Verify Magic UI components integrate properly
- Ensure screenshot capture works across different websites
- Verify DOM analysis accuracy

### 8. Development Workflow
- Always follow the main_rules.md workflow
- Create plans in tasks/todo.md before starting
- Check in before beginning work
- Provide high-level explanations for each change
- Add review sections to todo.md when complete

### 9. Error Handling
- Graceful failures for screenshot capture
- Fallbacks when Mobbin API is unavailable
- User-friendly error messages
- Retry mechanisms for AI API calls

### 10. Performance Considerations
- Optimize extension loading time
- Efficient screenshot processing
- Fast inspiration gallery loading
- Minimize API calls where possible

## Forbidden Actions
- Do not create overly complex architectures
- Avoid framework changes without justification
- Never ignore the milestone timeline
- Do not implement features outside the PRD scope without approval
- Avoid breaking existing functionality when adding new features