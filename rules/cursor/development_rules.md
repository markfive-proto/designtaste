# Cursor Development Rules for Vibe UI Assistant

## Project Overview
- **Product:** Vibe UI Assistant - Chrome extension for UI/UX improvement
- **Target:** Indie developers, vibe coders, designers who code, frontend developers
- **Core Function:** Screenshot UI sections → Get design inspiration → Receive AI-generated code improvements

## Cursor-Specific Development Guidelines

### 1. Code Editing Principles
- Use Cursor's autocomplete for Tailwind classes
- Leverage Cursor's context understanding for Chrome extension APIs
- Utilize Cursor's refactoring capabilities for component optimization
- Take advantage of Cursor's multi-file editing for related changes

### 2. File Structure & Navigation
- Keep related components in logical folders
- Use clear naming conventions: `UISelector.tsx`, `ScreenshotCapture.ts`
- Organize by feature: `/selection`, `/inspiration`, `/generation`, `/export`
- Maintain clean import/export structure

### 3. Next.js Development
- Use Cursor's Next.js 14 App Router intellisense
- Leverage autocompletion for Next.js API routes and server components
- Implement proper TypeScript types for props and API responses
- Follow Next.js best practices with Cursor's suggestions
- Use Chrome Extension integration as secondary layer

### 4. React Component Guidelines
- Use functional components with hooks
- Implement TypeScript interfaces for props
- Keep components under 100 lines when possible
- Use Cursor's component generation for boilerplate

### 5. Styling & Animation Integration
- Leverage Cursor's Tailwind intellisense for utility classes
- Use **Magic UI** components with Cursor's autocomplete
- Integrate **Framer Motion** animations with Cursor's motion helpers
- Create custom components only when necessary
- Follow responsive design patterns with Cursor's suggestions
- Use utility-first approach consistently

### 6. API Integration Patterns
- Create typed interfaces for all API responses
- Use async/await consistently
- Implement proper error boundaries
- Leverage Cursor's API call templates

### 7. Testing Strategy
- Write unit tests for utility functions
- Test Chrome extension APIs in isolation
- Use Cursor's test generation capabilities
- Focus on critical user flows: selection → inspiration → generation

### 8. Code Quality Standards
- Use ESLint and Prettier with Cursor integration
- Implement TypeScript strict mode
- Follow React best practices
- Maintain consistent code formatting

### 9. Performance Optimization
- Use React.memo for expensive components
- Implement lazy loading for inspiration gallery
- Optimize screenshot processing
- Leverage Cursor's performance suggestions

### 10. Development Workflow
- Use Cursor's Git integration effectively
- Create focused commits with clear messages
- Use branching for feature development
- Leverage Cursor's debugging capabilities

### 11. AI Integration Best Practices
- Type API responses from OpenAI/Claude
- Implement proper rate limiting
- Handle API failures gracefully
- Use Cursor's API integration helpers

### 12. Next.js & Authentication Considerations
- Handle Supabase authentication flows with Cursor's integration
- Implement secure API routes with proper middleware
- Manage environment variables safely
- Use Cursor's Next.js and Supabase templates
- Integrate Chrome extension as complementary tool

## Cursor Commands & Shortcuts to Use
- `Ctrl+Shift+P`: Command palette for quick actions
- `Ctrl+I`: AI inline editing for quick improvements
- `Ctrl+L`: AI chat for complex questions
- `Ctrl+Shift+L`: Multi-line select for batch edits
- `Alt+Click`: Multi-cursor for simultaneous edits

## File Organization Structure
```
src/
├── components/           # React components
│   ├── ui/              # Shared UI components
│   ├── selection/       # UI selection components
│   ├── inspiration/     # Design gallery components
│   └── generation/      # Code generation components
├── services/            # API and Chrome extension services
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
└── assets/              # Static assets
```

## Integration Points
- **Future Cursor Plugin:** Design for eventual Cursor IDE integration
- **Code Injection:** Prepare for direct code insertion into projects
- **Export Formats:** Support multiple output formats for different workflows

## Quality Checklist
- [ ] TypeScript compilation without errors
- [ ] ESLint passes without warnings
- [ ] Extension loads in Chrome without errors
- [ ] All API integrations work correctly
- [ ] UI is responsive and accessible
- [ ] Performance meets user experience standards