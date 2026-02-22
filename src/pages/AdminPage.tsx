import { useState } from 'react';
import { addDocument } from '../api/documents';
import ErrorToast from '../components/ErrorToast';

function AdminPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSuccess(false);

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    try {
      setIsSaving(true);
      await addDocument({ title: title.trim(), content: content.trim() });
      setTitle('');
      setContent('');
      setIsSuccess(true);
    } catch {
      setError('Could not add document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl animate-fadeIn">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Knowledge Base Management
        </div>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white">Add Document</h1>
        <p className="text-sm text-slate-400">Add a new document to your knowledge base. It will be auto-embedded for semantic search &amp; RAG.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6">
        <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mb-5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25"
          placeholder="e.g. Introduction to Vector Databases"
        />

        <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="content">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mb-5 min-h-52 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25"
          placeholder="Paste the document text here..."
        />

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Embedding &amp; Saving...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Add Document
              </>
            )}
          </button>

          {isSuccess && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 animate-fadeIn">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Document saved &amp; indexed!
            </span>
          )}
        </div>
      </form>

      <div className="mt-6 glass-light rounded-xl p-4 text-center">
        <p className="text-xs text-slate-500">
          Documents are automatically embedded using <span className="text-slate-400">MiniLM-L6-v2</span> (384 dimensions)
          and indexed in <span className="text-slate-400">MongoDB Atlas Vector Search</span> for instant retrieval.
        </p>
      </div>

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}

export default AdminPage;