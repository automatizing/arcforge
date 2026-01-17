# Polymarket Gamma API Documentation

Base URL: `https://gamma-api.polymarket.com`

No authentication required for read-only endpoints.

---

## Markets

### List Markets
```
GET /markets
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | integer | Number of results (>= 0) |
| offset | integer | Pagination offset (>= 0) |
| order | string | Comma-separated fields to order by |
| ascending | boolean | Sort direction |
| id | integer[] | Filter by market IDs |
| slug | string[] | Filter by slugs |
| tag_id | integer | Filter by tag |
| closed | boolean | Filter by closed status |
| active | boolean | Filter by active status |
| liquidity_num_min | number | Minimum liquidity |
| liquidity_num_max | number | Maximum liquidity |
| volume_num_min | number | Minimum volume |
| volume_num_max | number | Maximum volume |
| start_date_min | date-time | Start date from |
| start_date_max | date-time | Start date to |
| end_date_min | date-time | End date from |
| end_date_max | date-time | End date to |

**Response (key fields):**
```json
{
  "id": "string",
  "question": "string | null",
  "slug": "string | null",
  "image": "string | null",
  "icon": "string | null",
  "description": "string | null",
  "outcomes": "string | null",
  "outcomePrices": "string | null",
  "volume": "string | null",
  "volumeNum": "number | null",
  "liquidity": "string | null",
  "liquidityNum": "number | null",
  "active": "boolean | null",
  "closed": "boolean | null",
  "startDate": "date-time | null",
  "endDate": "date-time | null",
  "category": "string | null",
  "volume24hr": "number | null",
  "volume1wk": "number | null",
  "volume1mo": "number | null",
  "bestBid": "number | null",
  "bestAsk": "number | null",
  "lastTradePrice": "number | null",
  "oneDayPriceChange": "number | null",
  "oneWeekPriceChange": "number | null",
  "events": "object[]",
  "tags": "object[]"
}
```

**Example:**
```javascript
fetch('https://gamma-api.polymarket.com/markets')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Events

### List Events
```
GET /events
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | integer | Number of results (>= 0) |
| offset | integer | Pagination offset (>= 0) |
| order | string | Comma-separated fields to order by |
| ascending | boolean | Sort direction |
| id | integer[] | Filter by event IDs |
| tag_id | integer | Filter by tag |
| slug | string[] | Filter by slugs |
| tag_slug | string | Filter by tag slug |
| active | boolean | Filter by active status |
| archived | boolean | Filter by archived status |
| featured | boolean | Filter by featured status |
| closed | boolean | Filter by closed status |
| liquidity_min | number | Minimum liquidity |
| liquidity_max | number | Maximum liquidity |
| volume_min | number | Minimum volume |
| volume_max | number | Maximum volume |

**Response (key fields):**
```json
{
  "id": "string",
  "ticker": "string | null",
  "slug": "string | null",
  "title": "string | null",
  "subtitle": "string | null",
  "description": "string | null",
  "image": "string | null",
  "icon": "string | null",
  "active": "boolean | null",
  "closed": "boolean | null",
  "featured": "boolean | null",
  "liquidity": "number | null",
  "volume": "number | null",
  "volume24hr": "number | null",
  "volume1wk": "number | null",
  "startDate": "date-time | null",
  "endDate": "date-time | null",
  "category": "string | null",
  "markets": "object[]",
  "tags": "object[]"
}
```

**Example:**
```javascript
fetch('https://gamma-api.polymarket.com/events')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Get Event by ID
```
GET /events/{id}
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Event ID (required) |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| include_chat | boolean | Include chat data |
| include_template | boolean | Include template data |

**Example:**
```javascript
fetch('https://gamma-api.polymarket.com/events/123')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Tags

### List Tags
```
GET /tags
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | integer | Number of results (>= 0) |
| offset | integer | Pagination offset (>= 0) |
| order | string | Comma-separated fields to order by |
| ascending | boolean | Sort direction |
| is_carousel | boolean | Filter carousel tags |

**Response:**
```json
{
  "id": "string",
  "label": "string | null",
  "slug": "string | null",
  "forceShow": "boolean | null",
  "forceHide": "boolean | null",
  "isCarousel": "boolean | null",
  "createdAt": "date-time | null"
}
```

**Example:**
```javascript
fetch('https://gamma-api.polymarket.com/tags')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Get Tag by ID
```
GET /tags/{id}
```

**Example:**
```javascript
fetch('https://gamma-api.polymarket.com/tags/5')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Sports

### Get Sports Metadata
```
GET /sports
```

Returns metadata for various sports including images, resolution sources, and tags.

**Response:**
```json
{
  "sport": "string",
  "image": "string (URL)",
  "resolution": "string (URL)",
  "ordering": "string",
  "tags": "string (comma-separated IDs)",
  "series": "string"
}
```

**Example:**
```javascript
fetch('https://gamma-api.polymarket.com/sports')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Get Valid Sports Market Types
```
GET /sports/market-types
```

Returns list of valid sports market types for filtering.

**Response:**
```json
{
  "marketTypes": ["string"]
}
```

**Example:**
```javascript
fetch('https://gamma-api.polymarket.com/sports/market-types')
  .then(res => res.json())
  .then(data => console.log(data));
```

### List Teams
```
GET /teams
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | integer | Number of results (>= 0) |
| offset | integer | Pagination offset (>= 0) |
| order | string | Comma-separated fields to order by |
| ascending | boolean | Sort direction |
| league | string[] | Filter by league |
| name | string[] | Filter by team name |
| abbreviation | string[] | Filter by abbreviation |

**Response:**
```json
{
  "id": "integer",
  "name": "string | null",
  "league": "string | null",
  "record": "string | null",
  "logo": "string | null",
  "abbreviation": "string | null"
}
```

**Example:**
```javascript
fetch('https://gamma-api.polymarket.com/teams')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Common Use Cases

### Get Active Markets with Volume
```javascript
fetch('https://gamma-api.polymarket.com/markets?active=true&order=volumeNum&ascending=false&limit=20')
```

### Get Featured Events
```javascript
fetch('https://gamma-api.polymarket.com/events?featured=true&active=true')
```

### Get Markets by Tag/Category
```javascript
fetch('https://gamma-api.polymarket.com/markets?tag_id=5&limit=10')
```

### Get High Liquidity Markets
```javascript
fetch('https://gamma-api.polymarket.com/markets?liquidity_num_min=100000&order=liquidityNum&ascending=false')
```
