import { useEffect, useState } from 'react';

import api, { errMsg, inr } from '../../api/axios';

import { useToast } from '../../context/ToastContext';

import Pagination from '../../components/Pagination';

const MATERIALS = [
  '',
  'Cotton',
  'Organic Cotton',
  'Polyester',
  'Linen',
  'Denim',
  'Rayon',
  'Viscose',
  'Silk',
  'Satin',
  'Chiffon',
  'Georgette',
  'Wool',
  'Nylon',
  'Spandex',
  'Velvet',
  'Lace',
  'Crepe',
  'Other',
];

const GENDERS = ['Women', 'Men', 'Unisex', 'Kids'];

const AGE_GROUPS = ['Adult', 'Teen', 'Kids'];

const COMMON_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  'Free Size',
];

const COMMON_COLORS = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Pink',
  'Green',
  'Yellow',
  'Brown',
  'Beige',
  'Grey',
  'Purple',
  'Orange',
  'Multicolor',
];

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
  style: '',
  occasion: '',
  gender: 'Women',
  ageGroup: 'Adult',
  sizes: '',
  colors: '',
  fit: '',
  sleeveType: '',
  neckline: '',
  stock: 0,
  deliveryInfo: 'Delivered in 5-7 business days.',
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
    subcategory:
      initial?.subcategory?._id || initial?.subcategory || '',
    occasion: Array.isArray(initial?.occasion)
      ? initial.occasion.join(', ')
      : initial?.occasion || '',
    sizes: Array.isArray(initial?.sizes)
      ? initial.sizes.join(', ')
      : initial?.sizes || '',
    colors: Array.isArray(initial?.colors)
      ? initial.colors.join(', ')
      : initial?.colors || '',
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
    (c) =>
      String(c.parent?._id || c.parent) === String(f.category)
  );

  const set = (key) => (e) =>
    setF((prev) => ({
      ...prev,
      [key]:
        e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.value,
    }));

  const splitValues = (value) =>
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  // Upload product images.
  const upload = async (e) => {
    const input = e.target;
    const files = [...(input.files || [])];

    if (!files.length) return;

    const remaining = 8 - f.images.length;

    if (remaining <= 0) {
      toast(
        'You can upload a maximum of 8 images per product.',
        'err'
      );
      input.value = '';
      return;
    }

    if (files.length > remaining) {
      toast(
        `You can upload only ${remaining} more image(s).`,
        'err'
      );
      input.value = '';
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    const invalidFile = files.find(
      (file) =>
        !allowedTypes.includes(file.type) ||
        file.size > 5 * 1024 * 1024
    );

    if (invalidFile) {
      toast(
        'Choose JPG, PNG or WEBP images up to 5 MB each.',
        'err'
      );
      input.value = '';
      return;
    }

    const fd = new FormData();

    files.forEach((file) => fd.append('images', file));

    setImageBusy(true);
    setErr('');

    try {
      const { data } = await api.post('/upload', fd);

      if (!Array.isArray(data)) {
        throw new Error('The server returned an invalid image response.');
      }

      setF((prev) => ({
        ...prev,
        images: [...prev.images, ...data],
      }));

      toast('Images uploaded successfully.');
    } catch (er) {
      toast(errMsg(er), 'err');
    } finally {
      setImageBusy(false);
      input.value = '';
    }
  };

  // Remove an image from the form.
  const removeImg = async (index) => {
    const image = f.images[index];

    setF((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

    // Existing saved images are deleted after the product saves.
    // Newly uploaded images can be removed immediately.
    const existingImageIds = new Set(
      (initial?.images || [])
        .map((item) => item.publicId)
        .filter(Boolean)
    );

    if (
      image?.publicId &&
      !existingImageIds.has(image.publicId)
    ) {
      try {
        await api.delete('/upload', {
          data: { publicId: image.publicId },
        });
      } catch {
        toast(
          'Image removed from the form, but Cloudinary cleanup failed.',
          'err'
        );
      }
    }
  };

  // Upload a product video.
  const uploadProductVideo = async (e) => {
    const input = e.target;
    const file = input.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast('Choose an MP4, WEBM or MOV video.', 'err');
      input.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast('The video must be 50 MB or smaller.', 'err');
      input.value = '';
      return;
    }

    const fd = new FormData();

    fd.append('video', file);

    setVideoBusy(true);
    setErr('');

    try {
      const { data } = await api.post('/upload/video', fd);

      if (!data?.url) {
        throw new Error('The server did not return a video URL.');
      }

      setF((prev) => ({
        ...prev,
        video: {
          url: data.url,
          publicId: data.publicId || '',
        },
      }));

      toast('Product video uploaded successfully.');
    } catch (er) {
      toast(errMsg(er), 'err');
    } finally {
      setVideoBusy(false);
      input.value = '';
    }
  };

  // Remove a product video.
  const removeProductVideo = async () => {
    const currentVideo = f.video;
    const originalVideoId = initial?.video?.publicId;

    setF((prev) => ({
      ...prev,
      video: { url: '', publicId: '' },
    }));

    // Do not delete an existing saved video before the product saves.
    // Delete newly uploaded videos immediately.
    if (
      currentVideo?.publicId &&
      currentVideo.publicId !== originalVideoId
    ) {
      try {
        await api.delete('/upload/video', {
          data: { publicId: currentVideo.publicId },
        });
      } catch {
        toast(
          'Video removed from the form, but Cloudinary cleanup failed.',
          'err'
        );
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');

    if (imageBusy || videoBusy) {
      setErr('Please wait until all uploads are complete.');
      return;
    }

    if (!f.category) {
      setErr('Select a category.');
      return;
    }

    if (!f.images.length) {
      setErr('Upload at least one image.');
      return;
    }

    const num = (value) =>
      value === '' || value == null
        ? undefined
        : Number(value);

    const body = {
      ...f,
      price: Number(f.price),
      mrp: num(f.mrp),
      stock: Number(f.stock || 0),

      occasion: splitValues(f.occasion),
      sizes: splitValues(f.sizes),
      colors: splitValues(f.colors),

      subcategory: f.subcategory || undefined,

      video: f.video?.url
        ? {
            url: f.video.url,
            publicId: f.video.publicId || '',
          }
        : { url: '', publicId: '' },
    };

    if (!Number.isFinite(body.price) || body.price < 0) {
      setErr('Enter a valid selling price.');
      return;
    }

    if (
      body.mrp != null &&
      (!Number.isFinite(body.mrp) || body.mrp < body.price)
    ) {
      setErr(
        'MRP must be greater than or equal to the selling price.'
      );
      return;
    }

    if (
      !Number.isFinite(body.stock) ||
      body.stock < 0
    ) {
      setErr('Enter a valid stock quantity.');
      return;
    }

    setBusy(true);

    try {
      if (initial?._id) {
        await api.put(`/products/${initial._id}`, body);
      } else {
        await api.post('/products', body);
      }

      if (initial?._id) {
        // Delete saved images removed from the product.
        const retainedImageIds = new Set(
          f.images
            .map((image) => image.publicId)
            .filter(Boolean)
        );

        const removedImages = (initial.images || []).filter(
          (image) =>
            image.publicId &&
            !retainedImageIds.has(image.publicId)
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

        // Delete the original saved video if it was removed or replaced.
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

      toast('Product saved successfully.');
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

        {/* Basic product information */}
        <h4 style={{ margin: '8px 0 12px' }}>
          Basic information
        </h4>

        <div className="field">
          <label>Product name *</label>
          <input
            required
            value={f.name}
            onChange={set('name')}
            placeholder="e.g. Oversized Cotton T-Shirt"
          />
        </div>

        <div className="field">
          <label>Description *</label>
          <textarea
            required
            rows="3"
            value={f.description}
            onChange={set('description')}
            placeholder="Describe the product, fabric and fit..."
          />
        </div>

        <div className="grid2">
          <div className="field">
            <label>Category *</label>

            <select
              required
              value={f.category}
              onChange={(e) =>
                setF((prev) => ({
                  ...prev,
                  category: e.target.value,
                  subcategory: '',
                }))
              }
            >
              <option value="">Select category...</option>

              {parents.map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Subcategory</label>

            <select
              value={f.subcategory}
              onChange={set('subcategory')}
            >
              <option value="">None</option>

              {subs.map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Selling price (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={f.price}
              onChange={set('price')}
              placeholder="799"
            />
          </div>

          <div className="field">
            <label>MRP (₹, for discount)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={f.mrp}
              onChange={set('mrp')}
              placeholder="999"
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
            <input
              value={f.sku || ''}
              onChange={set('sku')}
              placeholder="e.g. TSHIRT-001"
            />
          </div>
        </div>

        {/* Clothing attributes */}
        <hr />

        <h4 style={{ margin: '8px 0' }}>
          Clothing attributes{' '}
          <span
            className="muted"
            style={{ fontWeight: 400 }}
          >
            (fill only what applies)
          </span>
        </h4>

        <div className="grid3">
          <div className="field">
            <label>Fabric type</label>

            <select
              value={f.material || ''}
              onChange={set('material')}
            >
              {MATERIALS.map((material) => (
                <option key={material} value={material}>
                  {material || 'Select fabric'}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Style</label>
            <input
              value={f.style || ''}
              onChange={set('style')}
              placeholder="Casual, Streetwear, Formal"
            />
          </div>

          <div className="field">
            <label>Occasions (comma separated)</label>
            <input
              value={f.occasion || ''}
              onChange={set('occasion')}
              placeholder="Casual, Partywear, Festive"
            />
          </div>

          <div className="field">
            <label>Gender</label>

            <select
              value={f.gender || 'Women'}
              onChange={set('gender')}
            >
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Age group</label>

            <select
              value={f.ageGroup || 'Adult'}
              onChange={set('ageGroup')}
            >
              {AGE_GROUPS.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Available sizes (comma separated)</label>
            <input
              value={f.sizes || ''}
              onChange={set('sizes')}
              placeholder="XS, S, M, L, XL, XXL"
            />
          </div>
        </div>

        {/* Additional clothing details */}
        <h4 style={{ margin: '12px 0' }}>
          Additional details
        </h4>

        <div className="grid2">
          <div className="field">
            <label>Colors (comma separated)</label>
            <input
              value={f.colors || ''}
              onChange={set('colors')}
              placeholder="Black, White, Beige"
              list="clothing-colors"
            />

            <datalist id="clothing-colors">
              {COMMON_COLORS.map((color) => (
                <option key={color} value={color} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label>Fit</label>

            <select
              value={f.fit || ''}
              onChange={set('fit')}
            >
              <option value="">Select fit</option>
              {[
                'Regular Fit',
                'Slim Fit',
                'Relaxed Fit',
                'Oversized Fit',
                'Loose Fit',
                'Skinny Fit',
                'Straight Fit',
                'A-Line Fit',
                'Other',
              ].map((fit) => (
                <option key={fit} value={fit}>
                  {fit}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Sleeve type</label>

            <select
              value={f.sleeveType || ''}
              onChange={set('sleeveType')}
            >
              <option value="">Select sleeve type</option>
              {[
                'Sleeveless',
                'Cap Sleeve',
                'Short Sleeve',
                'Half Sleeve',
                'Three-Quarter Sleeve',
                'Full Sleeve',
                'Puff Sleeve',
                'Other',
              ].map((sleeve) => (
                <option key={sleeve} value={sleeve}>
                  {sleeve}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Neckline</label>

            <select
              value={f.neckline || ''}
              onChange={set('neckline')}
            >
              <option value="">Select neckline</option>
              {[
                'Round Neck',
                'V-Neck',
                'Crew Neck',
                'Scoop Neck',
                'Square Neck',
                'Boat Neck',
                'Collared',
                'Polo Neck',
                'High Neck',
                'Halter Neck',
                'Other',
              ].map((neckline) => (
                <option key={neckline} value={neckline}>
                  {neckline}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Delivery information</label>
          <input
            value={f.deliveryInfo || ''}
            onChange={set('deliveryInfo')}
            placeholder="Delivered in 5-7 business days."
          />
        </div>

        {/* Product images */}
        <hr />

        <b>Product images *</b>

        <p className="muted">
          JPG, PNG or WEBP. Maximum 8 images, 5 MB each.
        </p>

        <div className="imgs" style={{ marginTop: 8 }}>
          {f.images.map((image, index) => (
            <div
              className="im"
              key={image.publicId || image.url || index}
            >
              <img
                src={image.url}
                alt={`Product image ${index + 1}`}
              />

              <button
                type="button"
                onClick={() => removeImg(index)}
                aria-label={`Remove image ${index + 1}`}
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

        {imageBusy && (
          <p className="muted">Uploading images...</p>
        )}

        {/* Product video */}
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

        {videoBusy && (
          <p className="muted">Uploading video...</p>
        )}

        {/* Product status */}
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
          ].map(([key, label]) => (
            <label className="check" key={key}>
              <input
                type="checkbox"
                checked={!!f[key]}
                onChange={set(key)}
              />{' '}
              {label}
            </label>
          ))}
        </div>

        {/* Form actions */}
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
            disabled={busy || imageBusy || videoBusy}
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
      .then((response) => setData(response.data))
      .catch((error) => toast(errMsg(error), 'err'));

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, low]);

  useEffect(() => {
    api
      .get('/categories/all')
      .then((response) => setCats(response.data))
      .catch((error) => toast(errMsg(error), 'err'));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = async (product) => {
    if (!product) {
      setEdit({});
      return;
    }

    try {
      const { data: fullProduct } = await api.get(
        `/products/admin/${product._id}`
      );

      setEdit(fullProduct);
    } catch (error) {
      toast(errMsg(error), 'err');
    }
  };

  const del = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;

    try {
      await api.delete(`/products/${product._id}`);

      await Promise.all([
        ...(product.images || [])
          .filter((image) => image.publicId)
          .map((image) =>
            api
              .delete('/upload', {
                data: { publicId: image.publicId },
              })
              .catch(() => {})
          ),

        ...(product.video?.publicId
          ? [
              api
                .delete('/upload/video', {
                  data: {
                    publicId: product.video.publicId,
                  },
                })
                .catch(() => {}),
            ]
          : []),
      ]);

      toast('Product deleted.');
      load();
    } catch (error) {
      toast(errMsg(error), 'err');
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
        <h1 className="serif">
          Products ({data.total})
        </h1>

        <button
          className="btn"
          onClick={() => open(null)}
        >
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

          if (page !== 1) {
            setPage(1);
          } else {
            load();
          }
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
          {data.items.map((product) => (
            <tr key={product._id}>
              <td>
                {product.images?.[0] && (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                  />
                )}
              </td>

              <td>{product.name}</td>

              <td>
                {product.subcategory?.name ||
                  product.category?.name}
              </td>

              <td>{inr(product.price)}</td>

              <td
                style={{
                  color:
                    product.stock <= 5
                      ? 'var(--danger)'
                      : undefined,
                }}
              >
                {product.stock}
              </td>

              <td>
                <span
                  className={`badge ${
                    product.isActive ? 'paid' : 'cancelled'
                  }`}
                >
                  {product.isActive ? 'active' : 'hidden'}
                </span>
              </td>

              <td>
                <div className="row-actions">
                  <button
                    className="btn sm outline"
                    onClick={() => open(product)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn sm danger"
                    onClick={() => del(product)}
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
