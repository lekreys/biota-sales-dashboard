import { useRef, useState } from 'react';
import type { SourceFile } from '../lib/types';

interface Props {
  files: SourceFile[];
  errors: string[];
  onFiles: (files: File[]) => void;
  onSample: () => void;
  onReset: () => void;
}

export function UploadArea({ files, errors, onFiles, onSample, onReset }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <section className="card">
      <div
        className={`dropzone${dragging ? ' dragging' : ''}${files.length ? ' compact' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles([...e.dataTransfer.files]);
        }}
      >
        <p className="dropzone-title">
          {files.length ? 'Tambah file CSV lain' : 'Tarik file CSV ekspor marketplace ke sini'}
        </p>
        <p className="muted">Bisa satu file gabungan atau beberapa file sekaligus (Shopee, TikTok Shop, Tokopedia).</p>
        <div className="actions">
          <button className="button" onClick={() => input.current?.click()}>
            Pilih file CSV
          </button>
          {files.length === 0 && (
            <button className="button secondary" onClick={onSample}>
              Pakai data contoh (Okt 2026)
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          multiple
          hidden
          onChange={(e) => {
            onFiles([...(e.target.files ?? [])]);
            e.target.value = '';
          }}
        />
      </div>

      {errors.length > 0 && (
        <ul className="alert" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <div className="file-list">
          {files.map((f) => (
            <span className="chip" key={f.name}>
              {f.name} · {f.rows.length} baris
            </span>
          ))}
          <button className="link" onClick={onReset}>
            Hapus semua
          </button>
        </div>
      )}
    </section>
  );
}
