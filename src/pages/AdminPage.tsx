import { useEffect, useState } from 'react';
import { addDocument, fetchStats } from '../api/documents';
import ErrorToast from '../components/ErrorToast';

const CATEGORIES = [
  'database', 'software engineering', 'AI research', 'technology', 'devops',
  'backend', 'frontend', 'NLP', 'data science', 'security', 'cloud computing',
  'machine learning', 'networking', 'mobile development', 'web development',
  'blockchain', 'IoT', 'programming languages', 'algorithms', 'operating systems',
];

function AdminPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docCount, setDocCount] = useState<number | null>(null);

  useEffect(() => {
    fetchStats().then(s => setDocCount(s.totalDocuments)).catch(() => {});
  }, [isSuccess]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSuccess(false);

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    try {
      setIsSaving(true);
      await addDocument({
        title: title.trim(),
        content: content.trim(),
        ...(category && { category }),
        ...(tags.length > 0 && { tags }),
      });
      setTitle('');
      setContent('');
      setCategory('');
      setTags([]);
      setTagInput('');
      setIsSuccess(true);
    } catch {
      setError('Could not add document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl animate-fadeIn">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Add Document</h1>
        <p className="text-sm text-slate-500">
          Add a new document to your knowledge base. It will be auto-embedded for semantic search &amp; RAG.
          {docCount !== null && <span className="text-slate-400 ml-1">({docCount} documents indexed)</span>}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="title">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder-slate-600 outline-none transition-colors focus:border-white/[0.16]"
            placeholder="e.g. Introduction to Vector Databases"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white outline-none transition-colors focus:border-white/[0.16] [&>option]:bg-slate-800"
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 text-slate-500 hover:text-white">
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-white/[0.16]"
              placeholder="Type a tag and press Enter (max 10)"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-400 hover:border-white/[0.12] hover:text-white transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-52 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder-slate-600 outline-none transition-colors focus:border-white/[0.16]"
            placeholder="Paste the document text here..."
          />
          <p className="mt-1 text-right text-[10px] text-slate-600">{content.length} / 10,000 chars</p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-white/[0.1] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.15] disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="mt-6 rounded-md border border-white/[0.04] bg-white/[0.02] p-4 text-center">
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