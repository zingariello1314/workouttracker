/**
 * BookFinder - Interface chat pour rechercher et télécharger des livres via Z-Library.
 * Sous-onglet "Bibliothèque" de l'onglet Livres.
 * Backend attendu : FastAPI sur localhost:8000 (proxied via /api/zlib).
 */
import React, { useState, useRef, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from '../../utils/translations';
import './BookFinder.css';

const API_BASE = '/api/zlib';

export default function BookFinder() {
  const t = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [format, setFormat] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const text = (input || '').trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const params = new URLSearchParams({ q: text });
      if (format) params.set('format', format);
      const res = await fetch(`${API_BASE}/search?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || `Erreur ${res.status}`);
      }

      const results = data.results || [];
      setMessages((prev) => [
        ...prev,
        { role: 'bot', results, error: null },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', results: [], error: err.message || 'Erreur lors de la recherche.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (bookId) => {
    try {
      const res = await fetch(`${API_BASE}/download/${bookId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition && disposition.match(/filename="?([^";]+)"?/);
      const filename = match ? match[1] : `book_${bookId}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', results: [], error: `Téléchargement impossible : ${err.message}` },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bookfinder">
      <div className="bookfinder-messages" role="log" aria-live="polite">
        {messages.length === 0 && !loading && (
          <div className="bookfinder-empty">
            <p><strong>{t('books.bookfinder.hint', 'Recherche Z-Library')}</strong></p>
            <p>{t('books.bookfinder.hintText', 'Tape un titre ou un auteur (ex. Harry Potter epub, Dostoïevski Crime et Châtiment pdf) et envoie.')}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' && (
              <div className="bookfinder-msg user">{msg.text}</div>
            )}
            {msg.role === 'bot' && (
              <div className="bookfinder-msg bot">
                {msg.error && <div className="bookfinder-msg error">{msg.error}</div>}
                {msg.results && msg.results.length > 0 && (
                  <div className="bookfinder-results">
                    {msg.results.map((book) => (
                      <div key={book.id || i} className="bookfinder-card">
                        {book.cover ? (
                          <img src={book.cover} alt="" className="bookfinder-card-cover" />
                        ) : (
                          <div className="bookfinder-card-cover" aria-hidden />
                        )}
                        <div className="bookfinder-card-body">
                          <div className="bookfinder-card-title">
                            {book.name || t('books.bookfinder.unknownTitle', 'Sans titre')}
                          </div>
                          <div className="bookfinder-card-meta">
                            {book.author && <span>{book.author}</span>}
                            {book.extension && <span> · {book.extension.toUpperCase()}</span>}
                            {book.size && <span> · {book.size}</span>}
                          </div>
                          <div className="bookfinder-card-actions">
                            <Button
                              size="sm"
                              variant="primary"
                              icon={Download}
                              onClick={() => handleDownload(book.id)}
                            >
                              {t('books.bookfinder.download', 'Télécharger')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {msg.results && msg.results.length === 0 && !msg.error && (
                  <span>{t('books.bookfinder.noResults', 'Aucun résultat.')}</span>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="bookfinder-msg bot">
            <div className="bookfinder-typing" aria-label={t('books.bookfinder.searching', 'Recherche en cours')}>
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bookfinder-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('books.bookfinder.placeholder', 'Titre ou auteur...')}
          disabled={loading}
          aria-label={t('books.bookfinder.placeholder', 'Titre ou auteur...')}
        />
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="bookfinder-format-select"
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '12px',
            border: '1px solid rgba(58, 134, 255, 0.45)',
            background: 'rgba(0, 0, 0, 0.55)',
            color: 'rgb(224, 242, 254)',
            fontSize: '0.9375rem',
          }}
          aria-label={t('books.bookfinder.format', 'Format')}
        >
          <option value="">{t('books.bookfinder.allFormats', 'Tous formats')}</option>
          <option value="epub">EPUB</option>
          <option value="pdf">PDF</option>
        </select>
        <Button
          variant="primary"
          size="md"
          icon={Search}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          {t('books.bookfinder.search', 'Rechercher')}
        </Button>
      </div>
    </div>
  );
}
