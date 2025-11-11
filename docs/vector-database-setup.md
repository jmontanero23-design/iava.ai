# Vector Database Setup for iAVA.ai

## Overview
Semantic search capabilities for trading signals, patterns, and historical data using vector embeddings.

## Recommended Providers

### Option 1: Pinecone (Easiest)
**Pros**: Fully managed, excellent performance, generous free tier
**Cons**: External dependency

**Setup**:
```bash
npm install @pinecone-database/pinecone
```

**Environment Variables**:
```env
PINECONE_API_KEY=your_key_here
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=iava-signals
```

**Usage**:
```javascript
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
})

const index = pinecone.index('iava-signals')

// Store signal
await index.upsert([{
  id: signal.id,
  values: embedding, // 1536-dim vector from OpenAI
  metadata: {
    symbol: signal.symbol,
    type: signal.type,
    timestamp: signal.timestamp,
    return: signal.return
  }
}])

// Search similar signals
const results = await index.query({
  vector: queryEmbedding,
  topK: 10,
  includeMetadata: true
})
```

### Option 2: Supabase pgvector (Self-hosted option)
**Pros**: Open source, full control, PostgreSQL-based
**Cons**: Requires more setup

**Setup**:
```bash
npm install @supabase/supabase-js
```

**SQL Schema**:
```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create signals table
CREATE TABLE signal_embeddings (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimensions
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create vector index
CREATE INDEX ON signal_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Similarity search function
CREATE FUNCTION match_signals(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id text,
  symbol text,
  signal_type text,
  similarity float
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    symbol,
    signal_type,
    1 - (embedding <=> query_embedding) as similarity
  FROM signal_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### Option 3: ChromaDB (Local development)
**Pros**: Runs locally, perfect for development
**Cons**: Not production-ready for scale

**Setup**:
```bash
pip install chromadb
# Run server: chroma run --host localhost --port 8000
npm install chromadb
```

## Embedding Generation

### Using OpenAI Embeddings
```javascript
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // 1536 dimensions, $0.02/1M tokens
      input: text
    })
  })

  const data = await response.json()
  return data.data[0].embedding
}
```

## Use Cases for iAVA.ai

### 1. Similar Signal Search
Find historically similar market setups:
```javascript
const currentSetup = `
  Symbol: AAPL
  Pattern: Bull flag breakout
  Volume: 2x average
  ADX: 32 (trending)
  Price: Above all EMAs
`

const embedding = await generateEmbedding(currentSetup)
const similarSignals = await searchVectorDB(embedding, 5)

// Returns 5 most similar historical setups with their outcomes
```

### 2. Pattern Recognition
Find specific chart patterns:
```javascript
const query = "parabolic advance followed by tight consolidation"
const matches = await semanticSearch(query)
```

### 3. Trade Journal Search
Natural language search through trade history:
```javascript
const query = "trades where I entered too early on momentum plays"
const relevantTrades = await searchTradeJournal(query)
```

### 4. Learning Content
Find relevant educational material:
```javascript
const query = "how to handle whipsaw in ranging markets"
const lessons = await searchLearningContent(query)
```

## Implementation in iAVA.ai

Create `/api/vector/search.js`:
```javascript
export default async function handler(req, res) {
  const { query, type, limit = 10 } = req.body

  // Generate embedding for query
  const embedding = await generateEmbedding(query)

  // Search vector DB
  const results = await index.query({
    vector: embedding,
    topK: limit,
    filter: type ? { type } : {}
  })

  res.json({ results })
}
```

Create `/src/utils/vectorSearch.js`:
```javascript
export async function searchSimilarSignals(signal, limit = 5) {
  const queryText = serializeSignal(signal)
  const response = await fetch('/api/vector/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: queryText,
      type: 'signal',
      limit
    })
  })

  return response.json()
}
```

## Cost Estimates

- **Embeddings**: $0.02 per 1M tokens (OpenAI text-embedding-3-small)
- **Pinecone Free Tier**: 100K vectors, perfect for signals
- **Storage**: ~6KB per signal (1536 dims × 4 bytes)

**Example**: 10,000 signals = ~60MB storage, $0.20 embedding cost

## Next Steps

1. Choose provider (recommend Pinecone for MVP)
2. Set up API keys in Vercel environment
3. Create embedding pipeline for new signals
4. Build search UI component
5. Backfill historical signals (if any)

## Resources

- [Pinecone Docs](https://docs.pinecone.io)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [ChromaDB Docs](https://docs.trychroma.com)
