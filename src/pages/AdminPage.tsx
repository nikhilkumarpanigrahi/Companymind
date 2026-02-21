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
    <section className="mx-auto w-full max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Add Document</h1>
      <p className="mb-8 text-slate-600">Create a new searchable document in your backend index.</p>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mb-5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300"
          placeholder="Document title"
        />

        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="content">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="mb-5 min-h-44 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300"
          placeholder="Paste document text"
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Saving...' : 'Add Document'}
          </button>

          {isSuccess && <span className="text-sm font-medium text-emerald-600">Saved successfully.</span>}
        </div>
      </form>

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </section>
  );
}

export default AdminPage;