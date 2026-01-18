import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const SYSTEM_PROMPT = `You are building a Polymarket prediction markets viewer for 2026.

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
Colors: Background #0F172A, Cards #1E293B, Text #FFFFFF/#94A3B8, Yes #22C55E, No #EF4444, Accent #3B82F6
Layout: Responsive grid (3 cols desktop, 2 tablet, 1 mobile), 15 market cards minimum
Font: system-ui, -apple-system, sans-serif

## API - EXACT CODE TO USE
The API endpoint is: /api/polymarket/markets?closed=false&limit=15

IMPORTANT: The outcomePrices field is a JSON STRING like "[\"0.65\",\"0.35\"]" - you MUST parse it with JSON.parse()

Here is the EXACT JavaScript to use in script.js:

// Polymarket Markets Loader
(function() {
  function formatVolume(vol) {
    var num = parseFloat(vol) || 0;
    if (num >= 1000000) return "$" + (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return "$" + (num / 1000).toFixed(0) + "K";
    return "$" + num.toFixed(0);
  }

  function createCard(market) {
    var prices = JSON.parse(market.outcomePrices || '["0.5","0.5"]');
    var yesPercent = Math.round(parseFloat(prices[0]) * 100);
    var volume = formatVolume(market.volume);
    var div = document.createElement("div");
    div.className = "market-card";
    div.innerHTML =
      (market.image ? '<img src="' + market.image + '" alt="" onerror="this.style.display=\'none\'">' : "") +
      '<div class="card-content">' +
      '<h3>' + market.question + '</h3>' +
      '<div class="stats">' +
      '<span class="yes">' + yesPercent + '% Yes</span>' +
      '<span class="volume">' + volume + '</span>' +
      '</div>' +
      '<a href="https://polymarket.com/event/' + (market.slug || "") + '" target="_blank" class="trade-btn">Trade on Polymarket</a>' +
      '</div>';
    return div;
  }

  function loadMarkets() {
    var container = document.getElementById("markets");
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading markets...</div>';

    fetch("/api/polymarket/markets?closed=false&limit=15")
      .then(function(res) { return res.json(); })
      .then(function(markets) {
        container.innerHTML = "";
        if (!markets || !markets.length) {
          container.innerHTML = '<p class="error">No markets found</p>';
          return;
        }
        for (var i = 0; i < markets.length; i++) {
          container.appendChild(createCard(markets[i]));
        }
      })
      .catch(function(err) {
        console.error("Error:", err);
        container.innerHTML = '<p class="error">Failed to load markets</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadMarkets);
  } else {
    loadMarkets();
  }
})();

## HTML STRUCTURE
The index.html must have:
- A header with title "Trending Markets 2026"
- A div with id="markets" where cards will be inserted
- A refresh button that calls loadMarkets()

## CSS REQUIREMENTS
Style .market-card, .card-content, .stats, .yes, .volume, .trade-btn, .loading, .error
Images should be 100% width with object-fit: cover
Cards need hover effects and shadows

## RULES
- Do NOT use placeholder image services (no via.placeholder.com)
- Do NOT use template literals (backticks) - use string concatenation with +
- Do NOT invent API parameters - use exactly: closed=false&limit=15
- If image is missing, just hide it with onerror
- Year is 2026, not 2024`;
