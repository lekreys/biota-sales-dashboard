import { useRef } from 'react';
import type { SourceFile } from '../lib/types';
import { CloseIcon, FileIcon, UploadIcon } from './Icons';

function FileInput({ inputRef, onFiles }: { inputRef: React.RefObject<HTMLInputElement>; onFiles: (f: File[]) => void }) {
  return (
    <input
      ref={inputRef}
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
}

/** First screen, before any data: what the app does + where to drop the CSV. */
export function EmptyState({ onFiles, onSample }: { onFiles: (f: File[]) => void; onSample: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <section className="empty">
      <div className="empty-copy">
        <h1>Ekspor marketplace jadi angka yang bisa dipercaya.</h1>
        <ol className="steps">
          <li>
            <span>1</span>Upload CSV dari Shopee, TikTok Shop dan Tokopedia
          </li>
          <li>
            <span>2</span>Format, duplikat, SKU kosong dan status dibersihkan otomatis
          </li>
          <li>
            <span>3</span>Lihat net revenue per channel, produk dan tanggal
          </li>
        </ol>
        <p className="secondary small">File diproses di browser kamu dan tidak dikirim ke server mana pun.</p>
      </div>
      <div className="dropzone">
        <span className="dropzone-icon">
          <UploadIcon />
        </span>
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
        <FileInput inputRef={input} onFiles={onFiles} />
      </div>
    </section>
  );
}

/** Compact file controls in the top bar once data is loaded. */
export function FileActions({ files, onFiles, onReset }: { files: SourceFile[]; onFiles: (f: File[]) => void; onReset: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const rows = files.reduce((a, f) => a + f.rows.length, 0);
  return (
    <div className="file-actions">
      <span className="file-chip" title={files.map((f) => `${f.name} (${f.rows.length} baris)`).join('\n')}>
        <FileIcon />
        <span className="file-name">{files.length === 1 ? files[0].name : `${files.length} file`}</span>
        <span className="muted">· {rows} baris</span>
      </span>
      <button className="icon-button" onClick={() => input.current?.click()} title="Tambah CSV" aria-label="Tambah file CSV">
        <UploadIcon />
      </button>
      <button className="icon-button" onClick={onReset} title="Hapus semua data" aria-label="Hapus semua data">
        <CloseIcon />
      </button>
      <FileInput inputRef={input} onFiles={onFiles} />
    </div>
  );
}
