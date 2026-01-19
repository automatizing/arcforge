// Build phases for step-by-step page construction

export interface BuildPhase {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export const BUILD_PHASES: BuildPhase[] = [
  {
    id: 'structure',
    name: 'Building Structure',
    description: 'Creating HTML layout and page structure',
    prompt: `PHASE 1 - HTML STRUCTURE ONLY

Create the basic HTML structure for the page. Focus on:
- Semantic HTML elements (header, main, section, footer)
- Container divs with appropriate classes
- Placeholder content for where data will go
- Basic loading skeleton structure

For styles.css: Add ONLY minimal reset styles (margin, padding, box-sizing)
For script.js: Add ONLY a comment placeholder

The page should show a basic layout with placeholder text like "Loading markets..." and skeleton shapes.`
  },
  {
    id: 'styling',
    name: 'Applying Styles',
    description: 'Adding CSS styles and visual design',
    prompt: `PHASE 2 - STYLING AND DESIGN

Now add complete CSS styling to the existing HTML structure. Focus on:
- Apply the full color palette (backgrounds, text colors)
- Add all layout styles (grid, flexbox, spacing)
- Style cards, buttons, and interactive elements
- Add hover effects and transitions
- Make it fully responsive (3 columns desktop, 2 tablet, 1 mobile)
- Add loading skeleton animations

Keep the HTML structure mostly the same, just ensure classes match your CSS.
Keep script.js minimal for now (just a comment or console.log).

The page should now look visually complete but with static/placeholder content.`
  },
  {
    id: 'functionality',
    name: 'Adding Functionality',
    description: 'Implementing JavaScript and API integration',
    prompt: `PHASE 3 - JAVASCRIPT FUNCTIONALITY WITH PAGINATION

Now add the complete JavaScript functionality with pagination:
- Fetch data from /api/polymarket/events?closed=false&limit=12&offset=0
- Support pagination with limit (12 per page) and offset (page 1 = 0, page 2 = 12, etc.)
- This returns EVENTS (not markets). Each event has: title, slug, image, volume, volume24hr, liquidity
- Use event.image for the image URL (NOT external placeholder services)
- Use event.title for the display text (NOT event.question)
- Render event cards with: image, title, and 3 stats (Volume, 24h Volume, Liquidity)
- DO NOT show Yes/No percentages - events have multiple sub-markets
- Format money nicely ($1.2M, $500K, etc.) for all 3 stats
- Handle loading states (show/hide skeletons)
- Handle errors gracefully with console.error
- Add refresh button functionality
- Add pagination controls: Previous button, Page indicator, Next button
- Disable Previous on page 1, scroll to top on page change
- Make buttons link to https://polymarket.com/event/ + event.slug

Keep HTML and CSS mostly the same, just ensure they support the dynamic content.
Add a .pagination section at the bottom with prev-btn, page-info, next-btn.
Stats should show 3 columns: Volume | 24h | Liquidity

The page should now be fully functional with real data from the API and pagination.`
  }
];

export function getPhasePrompt(phaseId: string, userInstruction: string): string {
  const phase = BUILD_PHASES.find(p => p.id === phaseId);
  if (!phase) return userInstruction;

  return `${phase.prompt}

User's original request: ${userInstruction}

Remember: Output ONLY the 3 files with delimiters. No explanations.`;
}
