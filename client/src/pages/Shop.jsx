import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { ProductGrid } from '../components/ProductCard';
import Pagination from '../components/Pagination';

const MULTI = ['material', 'purity', 'gemstone', 'style', 'occasion', 'gender', 'ageGroup', 'size', 'clarity'];
const LABELS = { material: 'Material', purity: 'Purity', gemstone: 'Gemstone', style: 'Style', occasion: 'Occasion', size: 'Size', clarity: 'Diamond clarity' };
const FACET_KEY = { material: 'materials', purity: 'purities', gemstone: 'gemstones', style: 'styles', occasion: 'occasions', size: 'sizes', clarity: 'clarities' };

// One component serves /shop, /category/:slug and /search
export default function Shop({ mode = 'shop' }) {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [facets, setFacets] = useState(null);
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState({ min: sp.get('minPrice') || '', max: sp.get('maxPrice') || '' });

  const q = sp.get('q') || '';
  const page = Number(sp.get('page') || 1);
  const sort = sp.get('sort') || 'featured';
  const category = mode === 'category' ? slug : sp.get('category') || '';

  useEffect(() => {
    if (mode === 'category') api.get(`/categories/slug/${slug}`).then((r) => setCat(r.data)).catch(() => setCat(null));
    else setCat(null);
  }, [mode, slug]);

  const params = useMemo(() => {
    const p = {};
    sp.forEach((v, k) => { if (v) p[k] = v; });
    if (mode === 'category') p.category = slug;
    if (mode === 'search') p.search = q;
    delete p.q;
    p.limit = 12;
    return p;
  }, [sp, mode, slug, q]);

  useEffect(() => {
    setLoading(true);
    api.get('/products', { params }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [params]);

  useEffect(() => {
    api.get('/products/facets', { params: { category: category || undefined, search: mode === 'search' ? q : undefined } })
      .then((r) => setFacets(r.data)).catch(() => {});
  }, [category, q, mode]);

  const update = (patch) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v == null ? n.delete(k) : n.set(k, v)));
    if (!('page' in patch)) n.delete('page');
    setSp(n);
  };
  const toggleMulti = (key, val) => {
    const cur = (sp.get(key) || '').split(',').filter(Boolean);
    const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val];
    update({ [key]: next.join(',') });
  };
  const has = (key, val) => (sp.get(key) || '').split(',').includes(val);

  const title = mode === 'search' ? `Results for “${q}”` : cat?.name || 'Explore All';

  return (
    <div className="container section" style={{ paddingTop: 28 }}>
      <div className="crumbs">
        <Link to="/">Home</Link> / {cat?.parentDoc && <><Link to={`/category/${cat.parentDoc.slug}`}>{cat.parentDoc.name}</Link> / </>}{title}
      </div>
      <h1 style={{ fontSize: '2.4rem' }}>{title}</h1>
      {cat?.description && <p className="muted" style={{ marginBottom: 10 }}>{cat.description}</p>}
      {cat?.children?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 4px' }}>
          {cat.children.map((s) => <Link key={s._id} to={`/category/${s.slug}`} className="btn sm outline">{s.name}</Link>)}
        </div>
      )}

      <div className="shop" style={{ marginTop: 20 }}>
        <aside className={`filters ${open ? 'open' : ''}`}>
          <button className="btn sm outline filter-toggle" style={{ marginBottom: 12 }} onClick={() => setOpen(false)}>Close ✕</button>

          <h4>Price (₹)</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" type="number" min="0" placeholder={facets ? String(facets.price.min) : 'Min'} value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} />
            <input className="input" type="number" min="0" placeholder={facets ? String(facets.price.max) : 'Max'} value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} />
          </div>
          <button className="btn sm block" style={{ marginTop: 8 }} onClick={() => update({ minPrice: price.min, maxPrice: price.max })}>Apply</button>

          {facets && Object.keys(LABELS).map((key) => {
            const opts = facets[FACET_KEY[key]] || [];
            if (!opts.length) return null; // only show attributes that exist for these products
            return (
              <div key={key}>
                <h4>{LABELS[key]}</h4>
                {opts.map((o) => <label key={o} className="check"><input type="checkbox" checked={has(key, o)} onChange={() => toggleMulti(key, o)} /> {o}</label>)}
              </div>
            );
          })}

          <h4>For</h4>
          {['Women', 'Men'].map((o) => <label key={o} className="check"><input type="checkbox" checked={has('gender', o)} onChange={() => toggleMulti('gender', o)} /> {o}</label>)}
         

          <h4>Availability</h4>
          {[['', 'All'], ['in', 'In stock'], ['out', 'Out of stock']].map(([v, l]) => (
            <label key={v} className="check"><input type="radio" name="stock" checked={(sp.get('stock') || '') === v} onChange={() => update({ stock: v })} /> {l}</label>
          ))}

          <button className="btn sm outline block" style={{ marginTop: 16 }} onClick={() => { setSp(mode === 'search' ? { q } : {}); setPrice({ min: '', max: '' }); }}>Clear all filters</button>
        </aside>

        <div>
          <div className="toolbar">
            <button className="btn sm outline filter-toggle" onClick={() => setOpen(true)}>Filters</button>
            <span className="muted">{loading ? 'Loading…' : `${data.total} product${data.total === 1 ? '' : 's'}`}</span>
            <select className="input" style={{ width: 'auto' }} value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
          <ProductGrid items={data.items} loading={loading} />
          <Pagination page={page} pages={data.pages} onChange={(n) => { update({ page: String(n) }); window.scrollTo(0, 0); }} />
        </div>
      </div>
    </div>
  );
}
