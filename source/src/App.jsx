import { useEffect, useMemo, useState } from "react";

const API = "https://dummyjson.com/products?limit=40";
// Shown if the API cannot be reached, so the store never looks empty
const FALLBACK = [
  [1, "Studio Headphones", "audio", 120, 10, 4.7, "🎧"], [2, "Smart Watch", "wearables", 199, 15, 4.5, "⌚"],
  [3, "Leather Backpack", "bags", 85, 5, 4.3, "🎒"], [4, "Desk Lamp", "home", 39, 0, 4.1, "💡"],
  [5, "Running Shoes", "shoes", 99, 20, 4.6, "👟"], [6, "Ceramic Mug Set", "home", 24, 0, 4.8, "☕"],
].map(([id, title, category, price, discountPercentage, rating, emoji]) => ({
  id, title, category, price, discountPercentage, rating, emoji, stock: 20, thumbnail: "",
  description: "A sample product shown while the live catalogue is unavailable.",
}));

const now = (p) => Math.round(p.price * (1 - p.discountPercentage / 100) * 100) / 100;
const usd = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const pretty = (s) => s.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

function useStored(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}

function Img({ p, big }) {
  const [bad, setBad] = useState(false);
  return p.thumbnail && !bad
    ? <img src={p.thumbnail} alt={p.title} loading="lazy" onError={() => setBad(true)} />
    : <div className={`ph ${big ? "big" : ""}`} aria-hidden="true">{p.emoji || "🛍️"}</div>;
}

function Checkout({ items, total, onDone }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", address: "" });
  const [errs, setErrs] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 3) er.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email address.";
    if (!/^[+\d][\d\s-]{7,}$/.test(f.phone)) er.phone = "Enter a valid phone number.";
    if (f.address.trim().length < 8) er.address = "Enter your full address.";
    setErrs(er);
    if (!Object.keys(er).length) onDone();
  };
  return (
    <form onSubmit={submit} noValidate className="checkout">
      <h3>Delivery details</h3>
      {[["name", "Full name"], ["email", "Email"], ["phone", "Phone"], ["address", "Address"]].map(([k, label]) => (
        <label key={k}>{label}
          <input value={f[k]} onChange={set(k)} aria-invalid={Boolean(errs[k])} aria-describedby={`e-${k}`} />
          {errs[k] && <span className="err" id={`e-${k}`} role="alert">{errs[k]}</span>}
        </label>
      ))}
      <p className="muted">Payment: cash on delivery · {items} items</p>
      <button className="primary" type="submit">Place order · {usd(total)}</button>
    </form>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [q, setQ] = useState(""), [cat, setCat] = useState("all"), [sort, setSort] = useState("featured");
  const [cart, setCart] = useStored("luma:cart", {});
  const [wish, setWish] = useStored("luma:wish", []);
  const [theme, setTheme] = useStored("luma:theme", "light");
  const [view, setView] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [step, setStep] = useState("cart");
  const [order, setOrder] = useState(null);
  const [onlyWish, setOnlyWish] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(API, { signal: ctrl.signal }).then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setProducts(d.products); setStatus("ok"); })
      .catch((e) => { if (e.name !== "AbortError") { setProducts(FALLBACK); setStatus("offline"); } });
    return () => ctrl.abort();
  }, []);

  const cats = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const shown = useMemo(() => {
    const list = products.filter((p) => (cat === "all" || p.category === cat) && (!onlyWish || wish.includes(p.id))
      && p.title.toLowerCase().includes(q.toLowerCase()));
    const by = { low: (a, b) => now(a) - now(b), high: (a, b) => now(b) - now(a), rating: (a, b) => b.rating - a.rating };
    return by[sort] ? [...list].sort(by[sort]) : list;
  }, [products, q, cat, sort, onlyWish, wish]);

  const lines = products.filter((p) => cart[p.id]);
  const count = Object.values(cart).reduce((s, n) => s + n, 0);
  const total = lines.reduce((s, p) => s + now(p) * cart[p.id], 0);
  const add = (id, d = 1) => setCart((c) => { const n = (c[id] || 0) + d; const x = { ...c }; n > 0 ? (x[id] = n) : delete x[id]; return x; });
  const toggleWish = (id) => setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const closeDrawer = () => { setDrawer(false); setStep("cart"); setOrder(null); };

  return (
    <>
      <header className="top">
        <h1>Luma</h1>
        <input className="grow" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" />
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle dark mode">{theme === "light" ? "🌙" : "☀️"}</button>
        <button className={onlyWish ? "on" : ""} aria-pressed={onlyWish} onClick={() => setOnlyWish(!onlyWish)}>♥ {wish.length}</button>
        <button className="primary" onClick={() => setDrawer(true)}>Cart ({count})</button>
      </header>

      <main className="wrap">
        {status === "offline" && <p className="note" role="status">Live catalogue unavailable, showing sample products.</p>}
        <div className="filters">
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>{cats.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="featured">Featured</option><option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option><option value="rating">Top rated</option>
          </select>
          <span className="muted">{shown.length} products</span>
        </div>

        {status === "loading" && <div className="grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="card sk" />)}</div>}
        {status !== "loading" && shown.length === 0 && <p className="muted">No products match your search.</p>}
        <div className="grid">
          {shown.map((p) => (
            <article className="card" key={p.id}>
              <button className="heart" aria-pressed={wish.includes(p.id)} aria-label="Add to wishlist" onClick={() => toggleWish(p.id)}>{wish.includes(p.id) ? "♥" : "♡"}</button>
              <button className="thumb" onClick={() => setView(p)} aria-label={`View ${p.title}`}><Img p={p} /></button>
              <div className="info">
                <small className="muted">{pretty(p.category)}</small>
                <h2>{p.title}</h2>
                <p className="rate">★ {p.rating.toFixed(1)}</p>
                <p className="price">{usd(now(p))} {p.discountPercentage > 0 && <s>{usd(p.price)}</s>}</p>
                <button className="primary" onClick={() => add(p.id)}>Add to cart</button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {view && (
        <div className="overlay" onClick={() => setView(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={view.title} onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setView(null)} aria-label="Close">×</button>
            <Img p={view} big />
            <div>
              <small className="muted">{pretty(view.category)}{view.brand && ` · ${view.brand}`}</small>
              <h2>{view.title}</h2>
              <p className="rate">★ {view.rating.toFixed(1)} · {view.stock} in stock</p>
              <p>{view.description}</p>
              <p className="price big">{usd(now(view))} {view.discountPercentage > 0 && <s>{usd(view.price)}</s>}</p>
              <button className="primary" onClick={() => { add(view.id); setView(null); setDrawer(true); }}>Add to cart</button>
            </div>
          </div>
        </div>
      )}

      {drawer && (
        <div className="overlay" onClick={closeDrawer}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={closeDrawer} aria-label="Close cart">×</button>
            {order ? (
              <div className="done"><h2>Order placed 🎉</h2><p>Thank you! Your order number is <b>#{order}</b>.</p><button className="primary" onClick={closeDrawer}>Continue shopping</button></div>
            ) : step === "form" ? (
              <>
                <button className="link" onClick={() => setStep("cart")}>‹ Back to cart</button>
                <Checkout items={count} total={total} onDone={() => { setOrder(Math.floor(100000 + Math.random() * 900000)); setCart({}); }} />
              </>
            ) : (
              <>
                <h2>Your cart</h2>
                {lines.length === 0 && <p className="muted">Your cart is empty.</p>}
                <ul className="lines">
                  {lines.map((p) => (
                    <li key={p.id}>
                      <div className="mini"><Img p={p} /></div>
                      <div className="grow"><b>{p.title}</b><div className="qty">
                        <button onClick={() => add(p.id, -1)} aria-label={`Remove one ${p.title}`}>−</button><span>{cart[p.id]}</span>
                        <button onClick={() => add(p.id, 1)} aria-label={`Add one ${p.title}`}>+</button></div></div>
                      <b>{usd(now(p) * cart[p.id])}</b>
                    </li>
                  ))}
                </ul>
                {lines.length > 0 && <><p className="sum">Total <b>{usd(total)}</b></p><button className="primary" onClick={() => setStep("form")}>Checkout</button></>}
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
