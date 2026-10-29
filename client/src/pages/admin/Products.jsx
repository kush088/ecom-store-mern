
import { useEffect, useState } from 'react';
import api, { errMsg, inr } from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';

const MATERIALS = [
  '', 'Gold', 'Diamond', 'Silver', 'Platinum', 'Rose Gold',
  'White Gold', 'Brass', 'Alloy', 'Kundan', 'Polki', 'Pearl', 'Other',
];

const PURITIES = ['', '14K', '18K', '22K', '24K', '925 Sterling'];

const BLANK = {
  name: '',
  sku: '',
  description: '',
  category: '',
  subcategory: '',
  price: '',
  mrp: '',
  images: [],
  video: { url: '', publicId: '' },
  material: '',
  purity: '',
  weightGrams: '',
  diamond: { carat: '', clarity: '', color: '', cut: '' },
  gemstone: '',
  style: '',
  occasion: '',
  gender: 'Women',
  ageGroup: 'Adult',
  sizes: '',
  stock: 0,
  deliveryInfo: 'Delivered in 5-7 business days. Insured shipping.',
  isFeatured: false,
  isBestseller: false,
  isNewArrival: false,
  isTrending: false,
  isActive: true,
};

function ProductForm({ initial, cats, onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    ...BLANK,
    ...initial,
    category: initial?.category?._id || initial?.category || '',
    subcategory: initial?.subcategory?._id || initial?.subcategory || '',
    occasion: (initial?.occasion || []).join(', '),
    sizes: (initial?.sizes || []).join(', '),
    diamond: { ...BLANK.diamond, ...(initial?.diamond || {}) },
    images: initial?.images || [],
    video: {
      ...BLANK.video,
      ...(initial?.video || {}),
    },
  }));

  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [err, setErr] = useState('');

  const toast = useToast();
  const parents = cats.filter((c) => !c.parent);
  const subs = cats.filter(
    (c) => String(c.parent?._id || c.parent) === String(f.category)
  );

  const set = (k) => (e) =>
    setF((prev) => ({
      ...prev,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const setD = (k) => (e) =>
    setF((prev) => ({
      ...prev,
      diamond: { ...prev.diamond, [k]: e.target.value },
    }));

  // Upload product images
  const upload = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;

    const remaining = 8 - f.images.length;

    if (remaining <= 0) {
      toast('You can upload a maximum of 8 images per product.', 'err');
      e.target.value = '';
      return;
    }

    if (files.length > remaining) {
      toast(`You can upload only ${remaining} more image(s).`, 'err');
      e.target.value = '';
      return;
    }

    const fd = new FormData();
    files.forEach((file) => fd.append('images', file));

    setImageBusy(true);

    try {
      const { data } = await api.post('/upload', fd);
      setF((prev) => ({
        ...prev,
        images: [...prev.images, ...data],
      }));
    } catch (er) {
      toast(errMsg(er), 'err');
    } finally {
      setImageBusy(false);
      e.target.value = '';
    }
  };

  // Remove an image from the form. Existing product images are deleted
  // from Cloudinary only after the product has been saved successfully.
  const removeImg = async (i) => {
    const im = f.images[i];

    setF((prev) => ({
      ...prev,
      images: prev.images.filter((_, n) => n !== i),
    }));

    if (im.publicId && !initial?._id) {
      api
        .delete('/upload', { data: { publicId: im.publicId } })
        .catch(() => {});
    }
  };

  // Upload a product video
  const uploadProductVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (!allowedTypes.includes(file.type)) {
      toast('Choose an MP4, WEBM or MOV video.', 'err');
      e.target.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast('The video must be 50 MB or smaller.', 'err');
      e.target.value = '';
      return;
    }

    const fd = new FormData();
    fd.append('video', file);

    setVideoBusy(true);
    setErr('');

    try {
      const { data } = await api.post('/upload/video', fd);

      setF((prev) => ({
        ...prev,
        video: data,
      }));

      toast('Product video uploaded successfully.');
    } catch (er) {
      toast(errMsg(er), 'err');
    } finally {
      setVideoBusy(false);
      e.target.value = '';
    }
  };

  // Remove a video from the product form
  const removeProductVideo = async () => {
    const oldVideo = f.video;

    setF((prev) => ({
      ...prev,
      video: { url: '', publicId: '' },
    }));

    // For an existing product, delete the old video only after the
    // product save succeeds. For a newly uploaded unsaved video,
    // it can be deleted immediately.
    if (oldVideo?.publicId && !initial?._id) {
      try {
        await api.delete('/upload/video', {
          data: { publicId: oldVideo.publicId },
        });
      } catch {
        toast('Video removed from the form, but Cloudinary cleanup failed.', 'err');
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    if (!f.category) {
      setErr('Select a category');
      return;
    }

    if (!f.images.length) {
      setErr('Upload at least one image');
      return;
    }

    const num = (v) =>
      v === '' || v == null ? undefined : Number(v);

    const body = {
      ...f,
      price: Number(f.price),
      mrp: num(f.mrp),
      weightGrams: num(f.weightGrams),
      stock: Number(f.stock || 0),
      occasion: f.occasion
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      sizes: f.sizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      subcategory: f.subcategory || undefined,
      video: f.video?.url
        ? {
            url: f.video.url,
            publicId: f.video.publicId || '',
          }
        : { url: '', publicId: '' },
      diamond:
        f.material === 'Diamond' || num(f.diamond.carat)
          ? {
              ...f.diamond,
              carat: num(f.diamond.carat),
            }
          : undefined,
    };

    if (body.mrp != null && body.mrp < body.price) {
      setErr('MRP must be greater than or equal to selling price');
      return;
    }

    setBusy(true);

    try {
      if (initial?._id) {
        await api.put(`/products/${initial._id}`, body);
      } else {
        await api.post('/products', body);
      }

      // Clean up images removed from an existing product.
      if (initial?._id) {
        const retainedImageIds = new Set(
          f.images.map((image) => image.publicId).filter(Boolean)
        );

        const removedImages = (initial.images || []).filter(
          (image) =>
            image.publicId && !retainedImageIds.has(image.publicId)
        );

        await Promise.all(
          removedImages.map((image) =>
            api
              .delete('/upload', {
                data: { publicId: image.publicId },
              })
              .catch(() => {})
          )
        );

        // Delete the old video if it was replaced or removed.
        const oldVideo = initial.video;

        if (
          oldVideo?.publicId &&
          oldVideo.publicId !== body.video?.publicId
        ) {
          await api
            .delete('/upload/video', {
              data: { publicId: oldVideo.publicId },
            })
            .catch(() => {});
        }
      }

      toast('Product saved');
      onSaved();
    } catch (er) {
      setErr(errMsg(er));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg">
      <form className="modal" onSubmit={submit}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: 12 }}>
          {initial?._id ? 'Edit product' : 'New product'}
        </h2>

        {err && <p className="error">{err}</p>}

        <div className="field">
          <label>Name *</label>
          <input required value={f.name} onChange={set('name')} />
        </div>

        <div className="field">
          <label>Description *</label>
          <textarea
            required
            rows="3"
            value={f.description}
            onChange={set('description')}
          />
        </div>

        <div className="grid2">
          <div className="field">
            <label>Category *</label>
            <select
              required
              value={f.category}
              onChange={(e) =>
                setF({
                  ...f,
                  category: e.target.value,
                  subcategory: '',
                })
              }
            >
              <option value="">Select...</option>
              {parents.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Subcategory</label>
            <select value={f.subcategory} onChange={set('subcategory')}>
              <option value="">None</option>
              {subs.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Selling price (₹) *</label>
            <input
              type="number"
              min="0"
              required
              value={f.price}
              onChange={set('price')}
            />
          </div>

          <div className="field">
            <label>MRP (₹, for discount)</label>
            <input
              type="number"
              min="0"
              value={f.mrp}
              onChange={set('mrp')}
            />
          </div>

          <div className="field">
            <label>Stock *</label>
            <input
              type="number"
              min="0"
              required
              value={f.stock}
              onChange={set('stock')}
            />
          </div>

          <div className="field">
            <label>SKU</label>
            <input value={f.sku || ''} onChange={set('sku')} />
          </div>
        </div>

        <h4 style={{ margin: '8px 0' }}>
          Jewellery attributes{' '}
          <span className="muted" style={{ fontWeight: 400 }}>
            (fill only what applies)
          </span>
        </h4>

        <div className="grid3">
          <div className="field">
            <label>Material</label>
            <select value={f.material || ''} onChange={set('material')}>
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {m || '—'}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Purity (gold / silver only)</label>
            <select value={f.purity || ''} onChange={set('purity')}>
              {PURITIES.map((m) => (
                <option key={m} value={m}>
                  {m || '—'}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Weight (g)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={f.weightGrams ?? ''}
              onChange={set('weightGrams')}
            />
          </div>
        </div>

        {(f.material === 'Diamond' || f.diamond.carat) && (
          <div className="grid3">
            <div className="field">
              <label>Carat</label>
              <input
                type="number"
                step="0.01"
                value={f.diamond.carat}
                onChange={setD('carat')}
              />
            </div>

            <div className="field">
              <label>Clarity (e.g. VS1)</label>
              <input
                value={f.diamond.clarity}
                onChange={setD('clarity')}
              />
            </div>

            <div className="field">
              <label>Colour (e.g. F)</label>
              <input
                value={f.diamond.color}
                onChange={setD('color')}
              />
            </div>
          </div>
        )}

        <div className="grid3">
          <div className="field">
            <label>Gemstone</label>
            <input value={f.gemstone || ''} onChange={set('gemstone')} />
          </div>

          <div className="field">
            <label>Style</label>
            <input
              value={f.style || ''}
              onChange={set('style')}
              placeholder="Traditional, Modern..."
            />
          </div>

          <div className="field">
            <label>Occasions (comma separated)</label>
            <input
              value={f.occasion}
              onChange={set('occasion')}
              placeholder="Wedding, Festive"
            />
          </div>

          <div className="field">
            <label>Gender</label>
            <select value={f.gender} onChange={set('gender')}>
              {['Women', 'Men', 'Unisex', 'Kids'].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Age group</label>
            <select value={f.ageGroup} onChange={set('ageGroup')}>
              {['Adult', 'Teen', 'Kids'].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Sizes (comma separated)</label>
            <input
              value={f.sizes}
              onChange={set('sizes')}
              placeholder="12, 14, 16"
            />
          </div>
        </div>

        <div className="field">
          <label>Delivery information</label>
          <input
            value={f.deliveryInfo}
            onChange={set('deliveryInfo')}
          />
        </div>

        <hr />

        <b>Product images *</b>
        <p className="muted">
          JPG, PNG or WEBP. Maximum 8 images, 5 MB each.
        </p>

        <div className="imgs" style={{ marginTop: 8 }}>
          {f.images.map((im, i) => (
            <div className="im" key={im.publicId || im.url || i}>
              <img src={im.url} alt={`Product image ${i + 1}`} />
              <button
                type="button"
                onClick={() => removeImg(i)}
                aria-label={`Remove image ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          disabled={imageBusy || f.images.length >= 8}
          onChange={upload}
        />

        {imageBusy && <p className="muted">Uploading images...</p>}

        <hr />

        <b>Product video (optional)</b>
        <p className="muted">
          Upload an MP4, WEBM or MOV video. Maximum size: 50 MB.
        </p>

        {f.video?.url && (
          <div style={{ maxWidth: 420, margin: '12px 0' }}>
            <video
              src={f.video.url}
              controls
              playsInline
              preload="metadata"
              style={{
                width: '100%',
                maxHeight: 300,
                display: 'block',
                borderRadius: 8,
                background: '#111',
              }}
            />

            <button
              type="button"
              className="btn sm danger"
              style={{ marginTop: 8 }}
              disabled={videoBusy}
              onClick={removeProductVideo}
            >
              Remove video
            </button>
          </div>
        )}

        {!f.video?.url && (
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            disabled={videoBusy}
            onChange={uploadProductVideo}
          />
        )}

        {videoBusy && <p className="muted">Uploading video...</p>}

        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            margin: '16px 0',
          }}
        >
          {[
            ['isActive', 'Active'],
            ['isFeatured', 'Featured'],
            ['isBestseller', 'Bestseller'],
            ['isNewArrival', 'New arrival'],
            ['isTrending', 'Trending'],
          ].map(([k, label]) => (
            <label className="check" key={k}>
              <input
                type="checkbox"
                checked={!!f[k]}
                onChange={set(k)}
              />{' '}
              {label}
            </label>
          ))}
        </div>

        <div className="row-actions">
          <button
            className="btn"
            disabled={busy || imageBusy || videoBusy}
          >
            {busy ? 'Saving...' : 'Save product'}
          </button>

          <button
            type="button"
            className="btn outline"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Products() {
  const [data, setData] = useState({
    items: [],
    pages: 1,
    total: 0,
  });

  const [cats, setCats] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [low, setLow] = useState(false);
  const [edit, setEdit] = useState(null);

  const toast = useToast();

  const load = () =>
    api
      .get('/products/admin/list', {
        params: {
          page,
          search: search || undefined,
          lowStock: low || undefined,
        },
      })
      .then((r) => setData(r.data))
      .catch((e) => toast(errMsg(e), 'err'));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, low]);

  useEffect(() => {
    api
      .get('/categories/all')
      .then((r) => setCats(r.data))
      .catch((e) => toast(errMsg(e), 'err'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = async (p) => {
    if (!p) {
      setEdit({});
      return;
    }

    try {
      const { data: full } = await api.get(`/products/admin/${p._id}`);
      setEdit(full);
    } catch (e) {
      toast(errMsg(e), 'err');
    }
  };

  const del = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;

    try {
      await api.delete(`/products/${p._id}`);

      await Promise.all([
        ...(p.images || [])
          .filter((image) => image.publicId)
          .map((image) =>
            api
              .delete('/upload', {
                data: { publicId: image.publicId },
              })
              .catch(() => {})
          ),

        ...(p.video?.publicId
          ? [
              api
                .delete('/upload/video', {
                  data: { publicId: p.video.publicId },
                })
                .catch(() => {}),
            ]
          : []),
      ]);

      toast('Deleted');
      load();
    } catch (e) {
      toast(errMsg(e), 'err');
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <h1 className="serif">Products ({data.total})</h1>

        <button className="btn" onClick={() => open(null)}>
          + Add product
        </button>
      </div>

      <form
        style={{
          display: 'flex',
          gap: 8,
          margin: '10px 0 16px',
          flexWrap: 'wrap',
        }}
        onSubmit={(e) => {
          e.preventDefault();
          if (page !== 1) setPage(1);
          else load();
        }}
      >
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="btn sm">Search</button>

        <label className="check">
          <input
            type="checkbox"
            checked={low}
            onChange={(e) => {
              setLow(e.target.checked);
              setPage(1);
            }}
          />{' '}
          Low stock only
        </label>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {data.items.map((p) => (
            <tr key={p._id}>
              <td>
                {p.images?.[0] && (
                  <img src={p.images[0].url} alt={p.name} />
                )}
              </td>

              <td>{p.name}</td>

              <td>{p.subcategory?.name || p.category?.name}</td>

              <td>{inr(p.price)}</td>

              <td
                style={{
                  color: p.stock <= 5 ? 'var(--danger)' : undefined,
                }}
              >
                {p.stock}
              </td>

              <td>
                <span
                  className={`badge ${
                    p.isActive ? 'paid' : 'cancelled'
                  }`}
                >
                  {p.isActive ? 'active' : 'hidden'}
                </span>
              </td>

              <td>
                <div className="row-actions">
                  <button
                    className="btn sm outline"
                    onClick={() => open(p)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn sm danger"
                    onClick={() => del(p)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        pages={data.pages}
        onChange={setPage}
      />

      {edit && (
        <ProductForm
          initial={edit._id ? edit : null}
          cats={cats}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </>
  );
}
