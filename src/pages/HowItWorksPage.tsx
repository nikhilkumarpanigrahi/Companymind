import { useEffect, useState } from 'react';
import { fetchStats } from '../api/documents';
import type { StatsData } from '../types';

function HowItWorksPage() {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
  }, []);

  return (
    <section className="animate-fadeIn space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">How CompanyMind Works</h1>
        <p className="mt-3 mx-auto max-w-2xl text-sm text-slate-500 leading-relaxed">
          CompanyMind solves the challenge of finding relevant information across large document collections by using
          AI-powered semantic understanding instead of traditional keyword matching.
        </p>
      </div>

      {/* Problem Statement */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 border-l-2 border-l-red-500/40">
        <h2 className="mb-3 text-sm font-medium text-white">
          The Problem
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Traditional search systems rely on exact keyword matching, which fails when users describe concepts in different words.
          A search for "how to speed up database queries" would miss a document titled "Database Indexing Strategies" because
          the exact keywords don't match — even though the document is exactly what the user needs. Organizations lose
          productivity when employees can't find the right information buried in their knowledge base.
        </p>
      </div>

      {/* Solution */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 border-l-2 border-l-emerald-500/40">
        <h2 className="mb-3 text-sm font-medium text-white">
          Our Solution
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          CompanyMind converts every document into a 384-dimensional vector embedding that captures its <em className="text-slate-300">meaning</em>,
          not just its words. When you search, your query is also converted to a vector, and MongoDB Atlas finds the most
          semantically similar documents using cosine similarity. The RAG (Retrieval-Augmented Generation) pipeline goes
          further — it retrieves the top matching documents and feeds them to an LLM that generates a comprehensive,
          cited answer.
        </p>
      </div>

      {/* Pipeline Steps */}
      <div>
        <h2 className="mb-6 text-center text-sm font-medium text-white">The RAG Pipeline</h2>
        <div className="space-y-4">
          {[
            {
              step: 1,
              title: 'Document Ingestion',
              desc: 'Documents are added to the knowledge base. Each document\'s content is sent to the embedding model (MiniLM-L6-v2) which converts it into a 384-dimensional dense vector.',
              icon: (
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />
              ),
              color: 'indigo',
            },
            {
              step: 2,
              title: 'Vector Storage & Indexing',
              desc: 'The vector embedding is stored alongside the document in MongoDB Atlas. A Vector Search index (HNSW algorithm) enables fast approximate nearest-neighbor lookup across all vectors.',
              icon: (
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              ),
              color: 'purple',
            },
            {
              step: 3,
              title: 'Semantic Search',
              desc: 'When you search, your query is embedded into the same 384-dim space. MongoDB $vectorSearch finds the top-K documents with the highest cosine similarity — understanding meaning, not just keywords.',
              icon: (
                <>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </>
              ),
              color: 'cyan',
            },
            {
              step: 4,
              title: 'Context Assembly',
              desc: 'For AI-powered answers, the top 5 most relevant documents are retrieved and assembled into a structured context window with titles and content for the LLM to reference.',
              icon: (
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              ),
              color: 'amber',
            },
            {
              step: 5,
              title: 'LLM Answer Generation',
              desc: 'Groq\'s Llama 3 70B model generates a comprehensive answer using ONLY the retrieved context. It includes source citations so users can verify every claim against the original documents.',
              icon: (
                <>
                  <path d="M12 2a8 8 0 0 1 8 8c0 3.5-2 5.5-4 7l-1 4H9l-1-4c-2-1.5-4-3.5-4-7a8 8 0 0 1 8-8z" />
                  <path d="M10 22h4" />
                </>
              ),
              color: 'pink',
            },
          ].map((item) => {
            const borderColors: Record<string, string> = {
              indigo: 'border-indigo-500/30',
              purple: 'border-purple-500/30',
              cyan: 'border-cyan-500/30',
              amber: 'border-amber-500/30',
              pink: 'border-pink-500/30',
            };
            const bgColors: Record<string, string> = {
              indigo: 'bg-indigo-500/15',
              purple: 'bg-purple-500/15',
              cyan: 'bg-cyan-500/15',
              amber: 'bg-amber-500/15',
              pink: 'bg-pink-500/15',
            };
            const textColors: Record<string, string> = {
              indigo: 'text-indigo-400',
              purple: 'text-purple-400',
              cyan: 'text-cyan-400',
              amber: 'text-amber-400',
              pink: 'text-pink-400',
            };
            return (
              <div key={item.step} className={`rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 flex items-start gap-4 border-l-2 ${borderColors[item.color]}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${bgColors[item.color]}`}>
                  <svg className={`h-5 w-5 ${textColors[item.color]}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {item.icon}
                  </svg>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-600 bg-white/[0.05] rounded px-1.5 py-0.5">STEP {item.step}</span>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dataset Info */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-white">
          About the Dataset
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-white/[0.04] bg-white/[0.02] p-4">
            <h3 className="mb-2 text-sm font-medium text-slate-300">What's in it?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {stats ? stats.totalDocuments.toLocaleString() : '…'} curated technical documents spanning {stats ? `${stats.categories.length}+` : '…'} categories including AI, databases, software engineering,
              DevOps, security, NLP, cloud computing, and more. Each document is a comprehensive overview of a key
              technology topic with detailed explanations.
            </p>
          </div>
          <div className="rounded-md border border-white/[0.04] bg-white/[0.02] p-4">
            <h3 className="mb-2 text-sm font-medium text-slate-300">How it's structured</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Each document has a title, content body, category label, and semantic tags. The content is embedded using
              the all-MiniLM-L6-v2 model into 384-dimensional vectors, stored with the document in MongoDB Atlas for
              instant vector similarity search.
            </p>
          </div>
          <div className="rounded-md border border-white/[0.04] bg-white/[0.02] p-4">
            <h3 className="mb-2 text-sm font-medium text-slate-300">Why this dataset?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              The dataset simulates a real-world company knowledge base with diverse technical topics. It demonstrates
              how semantic search outperforms keyword search — for example, searching "speed up my app" returns documents
              about caching, indexing, and optimization even though those exact words aren't in the query.
            </p>
          </div>
          <div className="rounded-md border border-white/[0.04] bg-white/[0.02] p-4">
            <h3 className="mb-2 text-sm font-medium text-slate-300">Extensibility</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You can add your own documents through the Admin page. Each new document is automatically embedded
              and indexed, becoming instantly searchable. The system scales to thousands of documents with the
              same low-latency performance.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack Details */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-white">
          Tech Stack
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'MongoDB Atlas', role: 'Database + Vector Search', detail: '$vectorSearch aggregation with HNSW index, cosine similarity, 384-dim embeddings' },
            { name: 'Sentence Transformers', role: 'Embedding Model', detail: 'all-MiniLM-L6-v2 — lightweight, fast, 384-dim output, ideal for semantic similarity' },
            { name: 'Groq + Llama 3', role: 'LLM for RAG', detail: 'llama-3.3-70b-versatile via Groq\'s ultra-fast inference API (~1-3s response time)' },
            { name: 'FastAPI (Python)', role: 'Embedding Microservice', detail: 'Serves embedding generation as a REST API on port 8000 with health checks' },
            { name: 'Express.js', role: 'Backend API', detail: 'REST API with Zod validation, Helmet security, CORS, centralized error handling' },
            { name: 'React + Vite + TS', role: 'Frontend', detail: 'TypeScript SPA with Tailwind CSS, clean dark UI, real-time search with debounce' },
          ].map((tech) => (
            <div key={tech.name} className="rounded-md border border-white/[0.04] bg-white/[0.02] p-4 hover:border-white/[0.08] transition-colors">
              <h3 className="text-sm font-medium text-white">{tech.name}</h3>
              <p className="text-[11px] font-medium text-slate-400">{tech.role}</p>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{tech.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-white">
          Performance Benchmarks
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Embedding', value: '~50ms', desc: 'Query → 384-dim vector' },
            { label: 'Vector Search', value: '~20-80ms', desc: 'MongoDB $vectorSearch' },
            { label: 'Total Search', value: '<200ms', desc: 'End-to-end search' },
            { label: 'RAG Answer', value: '~1-3s', desc: 'Groq Llama 3 70B' },
          ].map((perf) => (
            <div key={perf.label} className="text-center">
              <p className="text-2xl font-semibold text-white">{perf.value}</p>
              <p className="text-xs font-medium text-slate-400">{perf.label}</p>
              <p className="text-[10px] text-slate-500">{perf.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksPage;
