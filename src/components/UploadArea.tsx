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
  const loaded = files.length > 0;

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      onFiles([...e.dataTransfer.files]);
    },
  };

  const fileInput = (
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
  );

  const errorList = errors.length > 0 && (
    <ul className="alert" role="alert">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );

  if (loaded) {
    return (
      <section className={`card upload-bar${dragging ? ' dragging' : ''}`} {...dropHandlers}>
        <div className="file-list">
          {files.map((f) => (
            <span className="chip" key={f.name}>
              {f.name} · {f.rows.length} baris
            </span>
          ))}
        </div>
        <div className="upload-actions">
          <button className="button secondary small-button" onClick={() => input.current?.click()}>
            + Tambah CSV
          </button>
          <button className="link" onClick={onReset}>
            Hapus semua
          </button>
        </div>
        {fileInput}
        {errorList}
      </section>
    );
  }

  return (
    <section className="card upload-hero rise">
      <div className="upload-copy">
        <h2 className="upload-title">Ubah ekspor marketplace jadi angka yang bisa dipercaya</h2>
        <ol className="steps">
          <li>
            <span>1</span>Upload CSV dari Shopee, TikTok Shop dan Tokopedia
          </li>
          <li>
            <span>2</span>Data dibersihkan otomatis: format, duplikat, SKU kosong, status
          </li>
          <li>
            <span>3</span>Jelajahi net revenue per channel, produk dan tanggal
          </li>
        </ol>
      </div>
      <div className={`dropzone${dragging ? ' dragging' : ''}`} {...dropHandlers}>
        <p className="dropzone-icon" aria-hidden>
          ⤓
        </p>
        <p className="dropzone-title">Tarik file CSV ke sini</p>
        <p className="secondary small">Satu file gabungan atau beberapa file sekaligus</p>
        <div className="actions">
          <button className="button" onClick={() => input.current?.click()}>
            Pilih file CSV
          </button>
          <button className="button secondary" onClick={onSample}>
            Pakai data contoh (Okt 2026)
          </button>
        </div>
        {fileInput}
      </div>
      {errorList}
    </section>
  );
}
