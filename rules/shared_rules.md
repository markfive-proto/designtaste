# Shared Development Rules for Vibe UI Assistant

## Project Standards (Claude & Cursor)

### 1. Core Product Principles
- **User-Centric Design:** Every feature must improve the UI/UX quality for vibe coders
- **Speed Over Perfection:** Fast iteration and MVP delivery over polished features
- **Visual Learning:** Provide side-by-side comparisons and visual examples
- **Actionable Output:** All AI suggestions must result in usable, copy-paste code

### 2. Technical Architecture Standards
- **Frontend:** Next.js 14 with App Router + React 18 + TypeScript
- **Styling:** TailwindCSS + Framer Motion + Magic UI components
- **Authentication:** Supabase for auth, database, and user management
- **Chrome Extension:** Manifest v3 for browser integration (secondary)
- **AI Integration:** OpenAI GPT-4 Vision or Claude for code generation
- **Backend:** Next.js API Routes for serverless functions

### 3. Development Timeline Adherence
Follow the 6-week milestone structure strictly:
- **Weeks 1-2:** UI selection + screenshot capture
- **Weeks 2-3:** GPT Vision + prompt generation
- **Weeks 3-4:** Inspiration gallery retrieval
- **Weeks 4-5:** Code generation and sharing interface
- **Week 6:** MVP testing and iteration

### 4. Code Quality Requirements
- **TypeScript:** Use strict mode for type safety
- **Testing:** Focus on critical user flows (selection → inspiration → generation)
- **Performance:** Optimize for fast screenshot processing and inspiration loading
- **Error Handling:** Graceful failures with user-friendly messages
- **Documentation:** Clear comments for complex logic only

### 5. User Experience Standards
- **Time-to-Improvement:** Minimize steps from UI selection to code output
- **Visual Feedback:** Clear indicators for loading, success, and error states
- **Accessibility:** Support keyboard navigation and screen readers
- **Cross-Browser:** Primary support for Chrome, secondary for Edge/Firefox

### 6. API Integration Guidelines
- **Mobbin API:** For design inspiration retrieval
- **OpenAI/Claude:** For code generation and UI analysis
- **Rate Limiting:** Implement proper throttling for API calls
- **Caching:** Cache inspiration results to reduce API usage
- **Fallbacks:** Provide alternative sources when primary APIs fail

### 7. Security & Privacy Standards
- **Permissions:** Request minimal Chrome extension permissions
- **Data Storage:** Store user feedback and history securely
- **API Keys:** Never expose API keys in client-side code
- **User Data:** Implement proper data retention and deletion policies

### 8. Component Support Scope
Focus on these UI component types:
- Hero sections and landing page elements
- Card layouts and content blocks
- Form designs and input elements
- Navigation and menu components
- Button and CTA designs
- Layout and spacing patterns

### 9. Code Generation Standards
- **Output Format:** Next.js components with Tailwind CSS, Magic UI, and Framer Motion
- **Code Quality:** Production-ready TypeScript with proper types
- **Responsiveness:** Mobile-first approach with breakpoints
- **Accessibility:** ARIA labels and semantic HTML structure
- **Animation Ready:** Include Framer Motion animations where appropriate
- **Copy-Paste Ready:** Complete components with imports and exports

### 10. Feedback & Iteration Process
- **User Ratings:** Implement "Was this helpful?" feedback system
- **Analytics:** Track time-to-improvement and user satisfaction
- **A/B Testing:** Test different prompt strategies and UI flows
- **Continuous Learning:** Store feedback for future AI model improvements

### 11. File Naming & Organization
- **Components:** PascalCase (e.g., `UISelector.tsx`)
- **Services:** camelCase (e.g., `screenshotService.ts`)
- **Utilities:** camelCase (e.g., `domAnalyzer.ts`)
- **Types:** PascalCase interfaces (e.g., `ScreenshotData.ts`)

### 12. Git & Version Control
- **Commit Messages:** Use conventional commit format
- **Branching:** Feature branches for new functionality
- **Pull Requests:** Required for all changes to main branch
- **Testing:** All PRs must pass automated tests

### 13. Success Metrics to Track
- Time from UI selection to code generation
- User satisfaction scores on AI suggestions
- Number of inspirations viewed per session
- Code copy/export usage rates
- Extension retention and repeat usage

### 14. Future-Proofing Considerations
- **Figma Plugin:** Design API structure for future Figma integration
- **Cursor Plugin:** Prepare for direct IDE code injection
- **Style Memory:** Plan for persistent user theme preferences
- **AI Co-Designer:** Architect for future drag-and-drop functionality

## Workflow Synchronization
Both Claude and Cursor should:
1. Follow the main_rules.md workflow process
2. Create plans in tasks/todo.md before starting work
3. Check in with user before beginning implementation
4. Provide high-level change explanations
5. Add review sections when completing tasks
6. Prioritize simplicity and minimal code changes