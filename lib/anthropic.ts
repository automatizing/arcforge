import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const SYSTEM_PROMPT = `You are building a Polymarket prediction events viewer for 2026.

## OUTPUT FORMAT - CRITICAL
Output EXACTLY 3 files with these delimiters. NO text before or after. NO markdown. NO explanations.

===FILE:index.html===
[your HTML here - NO style or script tags]
===ENDFILE===

===FILE:styles.css===
[your CSS here]
===ENDFILE===

===FILE:script.js===
[your JavaScript here]
===ENDFILE===

## DESIGN SPECS
Colors: Background #0F172A, Cards #1E293B, Text #FFFFFF/#94A3B8, Accent #3B82F6
Layout: Responsive grid (3 cols desktop, 2 tablet, 1 mobile), 15 event cards minimum
Font: system-ui, -apple-system, sans-serif

## API - EVENTS ENDPOINT
The API endpoint is: /api/polymarket/events?closed=false&limit=15

This returns EVENTS (not individual markets). Each event has:
- title: The event title to display
- slug: For the URL (https://polymarket.com/event/[slug])
- image: Image URL
- volume: Number (total volume)
- volume24hr: Number (24 hour volume)
- liquidity: Number

DO NOT show Yes/No percentages - events have multiple sub-markets with different outcomes.
Show only: Total Volume, 24h Volume, Liquidity

Here is the EXACT JavaScript to use in script.js:

// Polymarket Events Loader
(function() {
  function formatMoney(vol) {
    var num = parseFloat(vol) || 0;
    if (num >= 1000000) return "$" + (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return "$" + (num / 1000).toFixed(0) + "K";
    return "$" + num.toFixed(0);
  }

  function createCard(event) {
    var totalVol = formatMoney(event.volume);
    var vol24h = formatMoney(event.volume24hr);
    var liq = formatMoney(event.liquidity);
    var div = document.createElement("div");
    div.className = "event-card";
    div.innerHTML =
      (event.image ? '<img src="' + event.image + '" alt="" onerror="this.style.display=\'none\'">' : "") +
      '<div class="card-content">' +
      '<h3>' + event.title + '</h3>' +
      '<div class="stats">' +
      '<div class="stat"><span class="label">Volume</span><span class="value">' + totalVol + '</span></div>' +
      '<div class="stat"><span class="label">24h</span><span class="value">' + vol24h + '</span></div>' +
      '<div class="stat"><span class="label">Liquidity</span><span class="value">' + liq + '</span></div>' +
      '</div>' +
      '<a href="https://polymarket.com/event/' + (event.slug || "") + '" target="_blank" class="trade-btn">View on Polymarket</a>' +
      '</div>';
    return div;
  }

  function loadEvents() {
    var container = document.getElementById("events");
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading events...</div>';

    fetch("/api/polymarket/events?closed=false&limit=15")
      .then(function(res) { return res.json(); })
      .then(function(events) {
        container.innerHTML = "";
        if (!events || !events.length) {
          container.innerHTML = '<p class="error">No events found</p>';
          return;
        }
        for (var i = 0; i < events.length; i++) {
          container.appendChild(createCard(events[i]));
        }
      })
      .catch(function(err) {
        console.error("Error:", err);
        container.innerHTML = '<p class="error">Failed to load events</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadEvents);
  } else {
    loadEvents();
  }
})();

## HTML STRUCTURE
The index.html must have:
- A header with title "Trending Events 2026"
- A div with id="events" where cards will be inserted
- A refresh button that calls loadEvents()

## CSS REQUIREMENTS
Style .event-card, .card-content, .stats, .stat, .label, .value, .trade-btn, .loading, .error
Stats should display as 3 columns (Volume | 24h | Liquidity)
Images should be 100% width with object-fit: cover
Cards need hover effects and shadows

## RULES
- Do NOT use placeholder image services (no via.placeholder.com)
- Do NOT use template literals (backticks) - use string concatenation with +
- Do NOT invent API parameters - use exactly: closed=false&limit=15
- Do NOT show Yes/No percentages - this is for events, not individual markets
- If image is missing, just hide it with onerror
- Year is 2026, not 2024
- Use event.title NOT event.question (events have title, markets have question)`;
