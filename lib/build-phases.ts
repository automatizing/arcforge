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
    prompt: `PHASE 3 - JAVASCRIPT FUNCTIONALITY

Now add the complete JavaScript functionality:
- Fetch data from /api/polymarket/markets?closed=false&limit=15
- CRITICAL: The outcomePrices field is a JSON STRING like "[\"0.65\",\"0.35\"]" - you MUST use JSON.parse(market.outcomePrices) to get the array
- Use market.image for the image URL (NOT external placeholder services)
- Render market cards dynamically with: image, question, volume, liquidity, probability
- Format volume nicely ($1.2M, $500K, etc.)
- Calculate probability: parseFloat(JSON.parse(market.outcomePrices)[0]) * 100
- Handle loading states (show/hide skeletons)
- Handle errors gracefully with console.error
- Add refresh button functionality
- Make trade buttons link to https://polymarket.com/event/ + market.slug

Keep HTML and CSS mostly the same, just ensure they support the dynamic content.

The page should now be fully functional with real data from the API.`
  }
];

export function getPhasePrompt(phaseId: string, userInstruction: string): string {
  const phase = BUILD_PHASES.find(p => p.id === phaseId);
  if (!phase) return userInstruction;

  return `${phase.prompt}

User's original request: ${userInstruction}

Remember: Output ONLY the 3 files with delimiters. No explanations.`;
}
