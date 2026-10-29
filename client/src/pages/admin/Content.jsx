
import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const EMPTY_HOME_CONTENT = {
  promoVideo: { url: '', publicId: '' },
  promoVideoTitle: '',
  promoVideoSubtitle: '',
  promoVideoEnabled: false,
};

export default function Content() {
  const [banners, setBanners] = useState([]);
  const [tests, setTests] = useState([]);
  const [b, setB] = useState(null);
  const [t, setT] = useState({ name: '', city: '', text: '' });
  const [homeContent, setHomeContent] = useState(EMPTY_HOME_CONTENT);
  const [videoUploading, setVideoUploading] = useState(false);
  const [homeSaving, setHomeSaving] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      const [bannerRes, testimonialRes, homeRes] = await Promise.all([
        api.get('/admin/banners'),
        api.get('/admin/testimonials'),
        api.get('/admin/home-content'),
      ]);

      setBanners(bannerRes.data);
      setTests(testimonialRes.data);
      setHomeContent({
        ...EMPTY_HOME_CONTENT,
        ...homeRes.data,
        promoVideo: {
          ...EMPTY_HOME_CONTENT.promoVideo,
          ...(homeRes.data?.promoVideo || {}),
        },
      });
    } catch (er) {
      toast(errMsg(er), 'err');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uploadImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('images', file);

    try {
      const { data } = await api.post('/upload', fd);
      setB((current) => ({ ...current, image: data[0] }));
      toast('Image uploaded');
    } catch (er) {
      toast(errMsg(er), 'err');
    } finally {
      e.target.value = '';
    }
  };

  const uploadPromoVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (!allowedTypes.includes(file.type)) {
      toast('Choose an MP4, WEBM, or MOV video.', 'err');
      e.target.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast('Video must be 50 MB or smaller.', 'err');
      e.target.value = '';
      return;
    }

    const fd = new FormData();
    fd.append('video', file);

    setVideoUploading(true);

    try {
      const { data } = await api.post('/upload/video', fd);

      setHomeContent((current) => ({
        ...current,
        promoVideo: {
          url: data.url,
          publicId: data.publicId,
        },
      }));

      toast('Promotional video uploaded. Save settings to publish it.');
    } catch (er) {
      toast(errMsg(er), 'err');
    } finally {
      setVideoUploading(false);
      e.target.value = '';
    }
  };

  const saveHomeContent = async (e) => {
    e.preventDefault();
    setHomeSaving(true);

    try {
      const { data } = await api.put('/admin/home-content', homeContent);

      setHomeContent((current) => ({
        ...current,
        ...data,
        promoVideo: {
          ...current.promoVideo,
          ...(data?.promoVideo || {}),
        },
      }));

      toast('Homepage video settings saved');
    } catch (er) {
      toast(errMsg(er), 'err');
    } finally {
      setHomeSaving(false);
    }
  };

  const removePromoVideo = async () => {
    if (!homeContent.promoVideo?.url) return;

    if (!confirm('Remove the promotional video? Save settings afterward to publish the change.')) {
      return;
    }

    setHomeContent((current) => ({
      ...current,
      promoVideo: { url: '', publicId: '' },
      promoVideoEnabled: false,
    }));

    toast('Video removed from the form. Save settings to apply the change.');
  };

  const saveBanner = async (e) => {
    e.preventDefault();

    try {
      if (b._id) {
        await api.put(`/admin/banners/${b._id}`, b);
      } else {
        await api.post('/admin/banners', {
          ...b,
          order: banners.length,
        });
      }

      setB(null);
      await load();
      toast('Banner saved');
    } catch (er) {
      toast(errMsg(er), 'err');
    }
  };

  const delBanner = async (x) => {
    if (!confirm('Delete banner?')) return;

    try {
      await api.delete(`/admin/banners/${x._id}`);

      if (x.image?.publicId) {
        api
          .delete('/upload', { data: { publicId: x.image.publicId } })
          .catch(() => {});
      }

      await load();
      toast('Banner deleted');
    } catch (er) {
      toast(errMsg(er), 'err');
    }
  };

  const addTest = async (e) => {
    e.preventDefault();

    try {
      await api.post('/admin/testimonials', t);
      setT({ name: '', city: '', text: '' });
      await load();
      toast('Testimonial added');
    } catch (er) {
      toast(errMsg(er), 'err');
    }
  };

  return (
    <>
      <section>
        <h1 className="serif">Homepage Promotional Video</h1>

        <form
          className="card"
          style={{ maxWidth: 720, marginBottom: 28 }}
          onSubmit={saveHomeContent}
        >
          <p style={{ marginBottom: 16, opacity: 0.75 }}>
            Upload and manage the promotional video displayed on your homepage.
          </p>

          <div className="field">
            <label>Video title</label>
            <input
              value={homeContent.promoVideoTitle}
              onChange={(e) =>
                setHomeContent((current) => ({
                  ...current,
                  promoVideoTitle: e.target.value,
                }))
              }
              placeholder="Discover the Aurelia collection"
            />
          </div>

          <div className="field">
            <label>Video subtitle</label>
            <textarea
              rows="2"
              value={homeContent.promoVideoSubtitle}
              onChange={(e) =>
                setHomeContent((current) => ({
                  ...current,
                  promoVideoSubtitle: e.target.value,
                }))
              }
              placeholder="Video Description"
            />
          </div>

          {homeContent.promoVideo?.url ? (
            <div style={{ marginBottom: 16 }}>
              <video
                key={homeContent.promoVideo.url}
                src={homeContent.promoVideo.url}
                controls
                playsInline
                preload="metadata"
                style={{
                  display: 'block',
                  width: '100%',
                  maxHeight: 320,
                  borderRadius: 10,
                  background: '#111',
                  marginBottom: 10,
                }}
              />

              <button
                type="button"
                className="btn sm danger"
                onClick={removePromoVideo}
              >
                Remove video
              </button>
            </div>
          ) : (
            <p style={{ marginBottom: 12, opacity: 0.7 }}>
              No promotional video uploaded yet.
            </p>
          )}

          <div className="field">
            <label>Upload promotional video</label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              disabled={videoUploading}
              onChange={uploadPromoVideo}
            />
            <small>MP4, WEBM, or MOV · Maximum 50 MB</small>
          </div>

          {videoUploading && <p>Uploading video… Please wait.</p>}

          <label className="check" style={{ marginTop: 12 }}>
            <input
              type="checkbox"
              checked={Boolean(homeContent.promoVideoEnabled)}
              onChange={(e) =>
                setHomeContent((current) => ({
                  ...current,
                  promoVideoEnabled: e.target.checked,
                }))
              }
            />
            Display promotional video on homepage
          </label>

          <button
            className="btn"
            type="submit"
            disabled={videoUploading || homeSaving}
            style={{ marginTop: 16 }}
          >
            {homeSaving ? 'Saving…' : 'Save homepage settings'}
          </button>
        </form>
      </section>

      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 className="serif">Homepage banners</h1>

          <button
            className="btn"
            onClick={() =>
              setB({
                title: '',
                subtitle: '',
                ctaText: 'Shop now',
                link: '/shop',
                image: { url: '', publicId: '' },
                isActive: true,
              })
            }
          >
            + New banner
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th />
              <th>Title</th>
              <th>Link</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {banners.map((x) => (
              <tr key={x._id}>
                <td>
                  {x.image?.url && <img src={x.image.url} alt="" />}
                </td>
                <td>{x.title}</td>
                <td>{x.link}</td>
                <td>
                  <span
                    className={`badge ${x.isActive ? 'paid' : 'cancelled'}`}
                  >
                    {x.isActive ? 'live' : 'off'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn sm outline"
                      onClick={() => setB(x)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn sm danger"
                      onClick={() => delBanner(x)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h1 className="serif" style={{ marginTop: 30 }}>
          Testimonials
        </h1>

        <form
          className="card"
          style={{ maxWidth: 560, marginBottom: 14 }}
          onSubmit={addTest}
        >
          <div className="grid2">
            <div className="field">
              <label>Name</label>
              <input
                required
                value={t.name}
                onChange={(e) =>
                  setT({ ...t, name: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>City</label>
              <input
                value={t.city}
                onChange={(e) =>
                  setT({ ...t, city: e.target.value })
                }
              />
            </div>
          </div>

          <div className="field">
            <label>Text</label>
            <textarea
              required
              rows="2"
              value={t.text}
              onChange={(e) =>
                setT({ ...t, text: e.target.value })
              }
            />
          </div>

          <button className="btn sm" type="submit">
            Add testimonial
          </button>
        </form>

        <table className="table">
          <tbody>
            {tests.map((x) => (
              <tr key={x._id}>
                <td>
                  {x.name}, {x.city}
                </td>
                <td>{x.text}</td>
                <td>
                  <button
                    className="btn sm danger"
                    onClick={async () => {
                      try {
                        await api.delete(`/admin/testimonials/${x._id}`);
                        await load();
                        toast('Testimonial deleted');
                      } catch (er) {
                        toast(errMsg(er), 'err');
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {b && (
        <div className="modal-bg">
          <form
            className="modal"
            style={{ maxWidth: 520 }}
            onSubmit={saveBanner}
          >
            <h2 style={{ fontSize: '1.6rem', marginBottom: 12 }}>
              {b._id ? 'Edit' : 'New'} banner
            </h2>

            <div className="field">
              <label>Title</label>
              <input
                required
                value={b.title}
                onChange={(e) =>
                  setB({ ...b, title: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Subtitle</label>
              <input
                value={b.subtitle || ''}
                onChange={(e) =>
                  setB({ ...b, subtitle: e.target.value })
                }
              />
            </div>

            <div className="grid2">
              <div className="field">
                <label>Button text</label>
                <input
                  value={b.ctaText || ''}
                  onChange={(e) =>
                    setB({ ...b, ctaText: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label>Link</label>
                <input
                  value={b.link || ''}
                  onChange={(e) =>
                    setB({ ...b, link: e.target.value })
                  }
                />
              </div>
            </div>

            {b.image?.url && (
              <img
                src={b.image.url}
                alt=""
                style={{
                  height: 80,
                  maxWidth: '100%',
                  objectFit: 'cover',
                  marginBottom: 8,
                  borderRadius: 8,
                }}
              />
            )}

            <div className="field">
              <label>Banner image</label>
              <input
                type="file"
                accept="image/*"
                onChange={uploadImg}
              />
            </div>

            <label className="check" style={{ marginTop: 12 }}>
              <input
                type="checkbox"
                checked={Boolean(b.isActive)}
                onChange={(e) =>
                  setB({ ...b, isActive: e.target.checked })
                }
              />
              Live
            </label>

            <div className="row-actions" style={{ marginTop: 14 }}>
              <button className="btn" type="submit">
                Save
              </button>
              <button
                type="button"
                className="btn outline"
                onClick={() => setB(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
