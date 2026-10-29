export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  const out = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push('…' + n); out.push(n); });
  return (
    <div className="pager">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
      {out.map((n) => typeof n === 'string' ? <span key={n} style={{ padding: 8 }}>…</span> :
        <button key={n} className={n === page ? 'on' : ''} onClick={() => onChange(n)}>{n}</button>)}
      <button disabled={page === pages} onClick={() => onChange(page + 1)}>›</button>
    </div>
  );
}
