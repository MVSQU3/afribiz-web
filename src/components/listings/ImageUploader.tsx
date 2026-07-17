import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { compressImage } from '../../lib/image-compress';

export interface BusinessImage {
  id: string;
  url: string;
  position: number;
  isPrimary: boolean;
}

interface Props {
  businessId: string;
  images: BusinessImage[];
  onChange: (images: BusinessImage[]) => void;
}

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
}

export function ImageUploader({ businessId, images, onChange }: Props) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BusinessImage[]>(images);

  useEffect(() => setItems(images), [images]);

  const sync = (next: BusinessImage[]) => {
    setItems(next);
    onChange(next);
  };

  const uploadFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // 1. Compression locale
        const blob = await compressImage(file);
        // 2. Signature côté API
        const { data: sig } = await api.post<UploadSignature>(
          `/businesses/${businessId}/images/signature`,
        );
        // 3. Upload direct vers Cloudinary avec progression
        const form = new FormData();
        form.append('file', blob, file.name.replace(/\.\w+$/, '.jpg'));
        form.append('api_key', sig.apiKey);
        form.append('timestamp', String(sig.timestamp));
        form.append('folder', sig.folder);
        form.append('signature', sig.signature);

        const url: string = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', sig.uploadUrl);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve((JSON.parse(xhr.responseText) as { secure_url: string }).secure_url);
            } else reject(new Error(xhr.responseText));
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.send(form);
        });

        // 4. Rattacher au listing
        const { data: image } = await api.post<BusinessImage>(
          `/businesses/${businessId}/images`,
          { url },
        );
        sync([...itemsRef(), image]);
      }
    } catch {
      setError(t('images.uploadError'));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Référence fraîche pour la boucle d'upload multiple
  const itemsRef = () => items;

  const remove = async (imageId: string) => {
    await api.delete(`/businesses/${businessId}/images/${imageId}`);
    sync(items.filter((i) => i.id !== imageId));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const { data } = await api.put<BusinessImage[]>(
      `/businesses/${businessId}/images/order`,
      { orderedIds: next.map((i) => i.id) },
    );
    sync(data);
  };

  const setPrimary = async (imageId: string) => {
    const { data } = await api.put<BusinessImage[]>(
      `/businesses/${businessId}/images/${imageId}/primary`,
    );
    sync(data);
  };

  return (
    <div>
      {error && (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</p>
      )}
      <label
        className="card"
        style={{
          display: 'block',
          padding: 'var(--space-6)',
          textAlign: 'center',
          border: '2px dashed var(--color-border)',
          cursor: 'pointer',
          marginBottom: 'var(--space-4)',
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={uploading}
          onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
        />
        {uploading ? `${t('images.uploading')} ${progress}%` : t('images.addImages')}
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
        {items.map((img, i) => (
          <div key={img.id} className="card" style={{ overflow: 'hidden' }}>
            <img
              src={img.url.replace('/upload/', '/upload/w_300,h_200,c_fill,f_auto/')}
              alt="" loading="lazy"
              style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1)' }}>
              <button onClick={() => void move(i, -1)} disabled={i === 0} style={btn}>←</button>
              <button
                onClick={() => void setPrimary(img.id)}
                style={{ ...btn, color: img.isPrimary ? 'var(--color-primary)' : undefined }}
                title={t('images.setPrimary')}
              >
                {img.isPrimary ? '★' : '☆'}
              </button>
              <button onClick={() => void remove(img.id)} style={{ ...btn, color: 'var(--color-danger)' }}>✕</button>
              <button onClick={() => void move(i, 1)} disabled={i === items.length - 1} style={btn}>→</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 14,
  padding: '2px 6px',
};
