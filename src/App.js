import React, { useState, useEffect, useCallback } from "react";
import { FaBook, FaFlask, FaHistory, FaDragon } from "react-icons/fa";

// Categories & Icons
const categories = ["all", "fiction", "history", "science", "fantasy"];
const categoryIcons = {
  all: <FaBook />,
  fiction: <FaBook />,
  history: <FaHistory />,
  science: <FaFlask />,
  fantasy: <FaDragon />
};

// Cover helper
const getCoverUrl = (book) =>
  book.cover_id
    ? `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`
    : book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
    : "https://via.placeholder.com/260x380?text=No+Image";

// BookCard with highlighted title
const BookCard = ({ book, onClick, search }) => {
  const getHighlightedTitle = (title) => {
    if (!search) return title;
    const regex = new RegExp(`(${search})`, "gi"); // partial + case-insensitive
    return title.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div
      className="book-card"
      onClick={() => onClick(book)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => e.key === "Enter" && onClick(book)}
    >
      <img src={getCoverUrl(book)} alt={book.title} className="book-cover" loading="lazy" />
      <div className="book-info">
        <h3 dangerouslySetInnerHTML={{ __html: getHighlightedTitle(book.title) }} />
        <p className="author">{book.authors?.map(a => a.name).join(", ") || book.author_name?.join(", ") || "Unknown"}</p>
        <p className="rating">⭐ {Math.floor(Math.random() * 3 + 3)}.{Math.floor(Math.random() * 10)}</p>
      </div>
    </div>
  );
};

// Skeleton loading card
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-cover" />
    <div className="skeleton-info">
      <div className="skeleton-line short" />
      <div className="skeleton-line long" />
      <div className="skeleton-line short" />
    </div>
    <style>{`
      .skeleton-card { background:#fff; border-radius:16px; box-shadow:0 12px 28px rgba(0,0,0,0.08); min-height:380px; display:flex; flex-direction:column; overflow:hidden; }
      .skeleton-cover { height:310px; background:#eee; }
      .skeleton-info { padding:18px; flex:1; display:flex; flex-direction:column; gap:6px; }
      .skeleton-line { height:12px; background:#ddd; border-radius:6px; }
      .skeleton-line.short { width:40%; }
      .skeleton-line.long { width:70%; }
    `}</style>
  </div>
);

// BookModal
const BookModal = ({ book, onClose }) => {
  const [fullBook, setFullBook] = useState(null);
  useEffect(() => {
    if (!book?.key) return;
    const fetchFullBook = async () => {
      try {
        const res = await fetch(`https://openlibrary.org${book.key}.json`);
        const data = await res.json();
        setFullBook(data);
      } catch (err) { console.error(err); }
    };
    fetchFullBook();
  }, [book]);
  if (!book) return null;

  const cover = getCoverUrl(book);
  let description = fullBook?.description
    ? typeof fullBook.description === "string"
      ? fullBook.description
      : fullBook.description.value
    : book.first_sentence?.join(" ") || book.subtitle || "No description available.";
  if (description.length > 300) description = description.slice(0, 300) + "...";

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close modal">×</button>
        <div className="modal-body">
          <img src={cover} alt={book.title} className="modal-cover" loading="lazy" />
          <div className="modal-info">
            <h2>{book.title}</h2>
            <p className="author">{book.authors?.map((a) => a.name).join(", ") || book.author_name?.join(", ") || "Unknown"}</p>
            <p><strong>Subjects:</strong> {fullBook?.subjects?.join(", ") || book.subject?.join(", ") || "Unknown"}</p>
            <p><strong>First published:</strong> {book.first_publish_year || fullBook?.first_publish_date || "N/A"}</p>
            {book.key && <a href={`https://openlibrary.org${book.key}`} target="_blank" rel="noopener noreferrer" className="preview-btn">View on Open Library</a>}
            <p className="modal-desc">{description}</p>
          </div>
        </div>
      </div>
      <style>{`
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:2000; padding:1em; }
        .modal-content { background:white; border-radius:16px; max-width:900px; width:100%; max-height:90vh; overflow-y:auto; position:relative; box-shadow:0 0 28px rgba(0,0,0,0.25); animation:fadeInScale 0.3s ease; }
        @keyframes fadeInScale { from {opacity:0; transform:scale(0.9);} to {opacity:1; transform:scale(1);} }
        .close-btn { position:absolute; top:12px; right:16px; font-size:2rem; background:none; border:none; cursor:pointer; color:#555; }
        .modal-body { display:flex; gap:24px; flex-wrap:wrap; padding:20px; }
        .modal-cover { width:300px; height:auto; border-radius:12px; object-fit:cover; flex-shrink:0; }
        .modal-info { flex:1; min-width:250px; color:#222; }
        .modal-info h2 { font-size:1.8rem; margin-bottom:0.5em; color:var(--primary); }
        .author { font-size:1rem; margin-bottom:1em; color:#555; }
        .preview-btn { display:inline-block; margin-top:0.5em; padding:10px 18px; background:var(--primary); color:white; border-radius:12px; text-decoration:none; font-weight:600; transition:0.3s; }
        .preview-btn:hover { background:var(--secondary); }
        .modal-desc { margin-top:1em; color:#444; line-height:1.4; }
        @media (max-width:720px) { .modal-body { flex-direction:column; align-items:center; } .modal-cover, .modal-info { width:100%; } .modal-info { text-align:center; } }
      `}</style>
    </div>
  );
};

// Navbar
const Navbar = ({ activeCategory, setCategory }) => {
  const [underlineStyle, setUnderlineStyle] = useState({});
  const refs = categories.reduce((acc, cat) => { acc[cat] = React.createRef(); return acc; }, {});

  useEffect(() => {
    const activeRef = refs[activeCategory];
    if (activeRef?.current) {
      const rect = activeRef.current.getBoundingClientRect();
      const parentRect = activeRef.current.parentNode.parentNode.getBoundingClientRect();
      setUnderlineStyle({ width: `${rect.width}px`, left: `${rect.left - parentRect.left}px` });
    }
  }, [activeCategory, refs]);

  return (
    <nav className="navbar">
      <ul className="nav-list">
        {categories.map((cat) => (
          <li key={cat}>
            <button ref={refs[cat]} onClick={() => setCategory(cat)} className={activeCategory === cat ? "active" : ""}>
              {categoryIcons[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          </li>
        ))}
        <div className="underline" style={underlineStyle} />
      </ul>
      <style>{`
        .navbar { display:flex; justify-content:center; margin:24px 0 40px; background:#fff; border-radius:12px; box-shadow:0 6px 12px rgba(0,0,0,0.12); padding:0.8em 0; }
        .nav-list { display:flex; list-style:none; padding:0 20px; margin:0; gap:24px; position:relative; width:100%; max-width:650px; }
        .nav-list li button { border:none; background:none; padding:12px 28px; font-size:1.15rem; font-weight:500; border-radius:14px; cursor:pointer; color:#555; display:flex; align-items:center; gap:6px; transition: all 0.3s; }
        .nav-list li button.active, .nav-list li button:hover { background:#6a11cb; color:white; font-weight:700; box-shadow:0 2px 10px rgba(106,17,203,0.3); }
        .underline { position:absolute; bottom:6px; height:4px; background:#6a11cb; border-radius:4px; transition: all 0.35s cubic-bezier(.5,.8,.49,.98); z-index:1000; }
      `}</style>
    </nav>
  );
};

// BookList
const BookList = ({ category, onBookClick, search }) => {
  const [books, setBooks] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 40;

  const fetchBooks = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const currentOffset = reset ? 0 : offset;

    let url = "";
    if (search) {
      url = `https://openlibrary.org/search.json?title=${encodeURIComponent(search)}&limit=${limit}&offset=${currentOffset}`;
    } else if (category !== "all") {
      url = `https://openlibrary.org/subjects/${category}.json?limit=${limit}&offset=${currentOffset}`;
    } else {
      url = `https://openlibrary.org/search.json?q=book&limit=${limit}&offset=${currentOffset}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      const newBooks = category !== "all" && !search ? data.works : data.docs;
      setBooks(reset ? newBooks : [...books, ...newBooks]);
      setOffset(currentOffset + limit);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [category, offset, loading, search, books]);

  useEffect(() => { fetchBooks(true); }, [category, search]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 350 && !loading) fetchBooks();
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchBooks, loading]);

  return (
    <>
      <div className="book-grid">
        {books.map(book => <BookCard key={book.key} book={book} onClick={onBookClick} search={search} />)}
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      {!loading && books.length === 0 && <p className="loading">No books found 😢</p>}
      <style>{`
        .book-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:28px 24px; margin-top:10px; padding-bottom:60px; }
        .book-card { background:var(--card-bg); border-radius:var(--radius); box-shadow:var(--shadow); cursor:pointer; overflow:hidden; display:flex; flex-direction:column; min-height:380px; transition: transform 0.3s, box-shadow 0.3s; }
        .book-card:hover, .book-card:focus { transform: translateY(-10px) scale(1.05); box-shadow:0 20px 40px rgba(0,0,0,0.15); outline:none; }
        .book-cover { width:100%; height:310px; object-fit:cover; border-radius:var(--radius) var(--radius) 0 0; background:#eee; flex-shrink:0; }
        .book-info { padding:18px; display:flex; flex-direction:column; flex:1; color:#444; }
        .book-info h3 { color:var(--primary); margin:0 0 10px; font-weight:700; font-size:1.25rem; line-height:1.2; overflow-wrap:break-word; }
        .author { font-size:0.95rem; margin-bottom:10px; color:#666; flex-shrink:0; }
        .rating { font-weight:700; color:#f39c12; font-size:1rem; margin-top:auto; }
        .loading { text-align:center; margin:40px 0; font-size:1.3rem; color:var(--primary); font-weight:600; animation:pulse 1.4s infinite ease-in-out; }
        @keyframes pulse { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
        @media(max-width:700px){ .book-grid{ grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:20px 14px; } .book-cover{height:240px;} .book-info h3{font-size:1rem;} }
        mark { background-color:#fffd54; color:#000; padding:0 2px; border-radius:2px; }
      `}</style>
    </>
  );
};

// Main App
const App = () => {
  const [category, setCategory] = useState("all");
  const [selectedBook, setSelectedBook] = useState(null);
  const [search, setSearch] = useState("");

  return (
    <div className="app">
      <h1 className="title">📚 Supurana Book Explorer</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search books by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <button className="clear-btn" onClick={() => setSearch("")}>×</button>}
      </div>

      <Navbar activeCategory={category} setCategory={setCategory} />
      <BookList category={category} onBookClick={setSelectedBook} search={search} />
      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}

      <style>{`
        :root { --primary:#6a11cb; --secondary:#2575fc; --bg:#f8f9fc; --card-bg:#fff; --shadow:0 12px 28px rgba(0,0,0,0.08); --radius:16px; }
        .app { font-family:'Inter',Arial,sans-serif; background:var(--bg); padding:2em 3vw 5em; min-height:100vh; max-width:1200px; margin:0 auto; color:#222; }
        .title { text-align:center; font-size:2.8rem; font-weight:700; margin:0 0 25px; color:var(--primary); letter-spacing:0.04em; }
        .search-bar { display:flex; justify-content:center; position:relative; margin-bottom:20px; width:100%; max-width:400px; margin-left:auto; margin-right:auto; }
        .search-bar input { width:100%; padding:10px 36px 10px 16px; border-radius:12px; border:1px solid #ccc; font-size:1rem; }
        .clear-btn { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; font-size:1.2rem; cursor:pointer; color:#555; }
        .clear-btn:hover { color:#000; }
      `}</style>
    </div>
  );
};

export default App;
