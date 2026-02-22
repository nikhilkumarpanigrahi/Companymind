function HowItWorksPage() {
  return (
    <section className="animate-fadeIn space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-300">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Architecture &amp; Design
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">How CompanyMind Works</h1>
        <p className="mt-3 mx-auto max-w-2xl text-sm text-slate-400 leading-relaxed">
          CompanyMind solves the challenge of finding relevant information across large document collections by using
          AI-powered semantic understanding instead of traditional keyword matching.
        </p>
      </div>

      {/* Problem Statement */}
      <div className="glass rounded-2xl p-6 border-l-4 border-l-red-500/50">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          The Problem
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Traditional search systems rely on exact keyword matching, which fails when users describe concepts in different words.
          A search for "how to speed up database queries" would miss a document titled "Database Indexing Strategies" because
          the exact keywords don't match — even though the document is exactly what the user needs. Organizations lose
          productivity when employees can't find the right information buried in their knowledge base.
        </p>
      </div>

      {/* Solution */}
      <div className="glass rounded-2xl p-6 border-l-4 border-l-emerald-500/50">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
          <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          Our Solution
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          CompanyMind converts every document into a 384-dimensional vector embedding that captures its <em className="text-slate-300">meaning</em>,
          not just its words. When you search, your query is also converted to a vector, and MongoDB Atlas finds the most
          semantically similar documents using cosine similarity. The RAG (Retrieval-Augmented Generation) pipeline goes
          further — it retrieves the top matching documents and feeds them to an LLM that generates a comprehensive,
          cited answer.
        </p>
      </div>

      {/* Pipeline Steps */}
      <div>
        <h2 className="mb-6 text-center text-lg font-bold text-white">The RAG Pipeline</h2>
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
              <div key={item.step} className={`glass rounded-2xl p-5 flex items-start gap-4 border-l-4 ${borderColors[item.color]}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgColors[item.color]}`}>
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
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          About the Dataset
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass-light rounded-xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-300">What's in it?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              173 curated technical documents spanning 50+ categories including AI, databases, software engineering,
              DevOps, security, NLP, cloud computing, and more. Each document is a comprehensive overview of a key
              technology topic with detailed explanations.
            </p>
          </div>
          <div className="glass-light rounded-xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-300">How it's structured</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each document has a title, content body, category label, and semantic tags. The content is embedded using
              the all-MiniLM-L6-v2 model into 384-dimensional vectors, stored with the document in MongoDB Atlas for
              instant vector similarity search.
            </p>
          </div>
          <div className="glass-light rounded-xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-300">Why this dataset?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The dataset simulates a real-world company knowledge base with diverse technical topics. It demonstrates
              how semantic search outperforms keyword search — for example, searching "speed up my app" returns documents
              about caching, indexing, and optimization even though those exact words aren't in the query.
            </p>
          </div>
          <div className="glass-light rounded-xl p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-300">Extensibility</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You can add your own documents through the Admin page. Each new document is automatically embedded
              and indexed, becoming instantly searchable. The system scales to thousands of documents with the
              same low-latency performance.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack Details */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          Tech Stack
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'MongoDB Atlas', role: 'Database + Vector Search', detail: '$vectorSearch aggregation with HNSW index, cosine similarity, 384-dim embeddings' },
            { name: 'Sentence Transformers', role: 'Embedding Model', detail: 'all-MiniLM-L6-v2 — lightweight, fast, 384-dim output, ideal for semantic similarity' },
            { name: 'Groq + Llama 3', role: 'LLM for RAG', detail: 'llama-3.3-70b-versatile via Groq\'s ultra-fast inference API (~1-3s response time)' },
            { name: 'FastAPI (Python)', role: 'Embedding Microservice', detail: 'Serves embedding generation as a REST API on port 8000 with health checks' },
            { name: 'Express.js', role: 'Backend API', detail: 'REST API with Zod validation, Helmet security, CORS, centralized error handling' },
            { name: 'React + Vite + TS', role: 'Frontend', detail: 'TypeScript SPA with Tailwind CSS, glass-morphism UI, real-time search with debounce' },
          ].map((tech) => (
            <div key={tech.name} className="glass-light rounded-xl p-4 hover:bg-white/[0.04] transition-all">
              <h3 className="text-sm font-semibold text-white">{tech.name}</h3>
              <p className="text-[11px] font-medium text-indigo-400">{tech.role}</p>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{tech.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
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
              <p className="text-2xl font-bold text-white">{perf.value}</p>
              <p className="text-xs font-semibold text-indigo-400">{perf.label}</p>
              <p className="text-[10px] text-slate-500">{perf.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksPage;
