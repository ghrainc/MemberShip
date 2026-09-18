import { useState, useRef, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/MultiFileUploader.css'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'])
const ALLOWED_EXTS = new Set([...IMAGE_EXTS, '.pdf', '.doc', '.docx'])
const MAX_SIZE = 10 * 1024 * 1024

function getExt(name) {
  const i = (name || '').lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

function isImage(name) { return IMAGE_EXTS.has(getExt(name)) }
function isPdf(name) { return getExt(name) === '.pdf' }

function isHeic(file) {
  const e = getExt(file.name)
  return e === '.heic' || e === '.heif' || file.type === 'image/heic' || file.type === 'image/heif'
}

async function fixExifAndResize(file) {
  if (!IMAGE_EXTS.has(getExt(file.name))) return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const MAX = 2000
    let { width, height } = bitmap
    if (width > MAX || height > MAX) {
      if (width >= height) { height = Math.round(height * MAX / width); width = MAX }
      else { width = Math.round(width * MAX / height); height = MAX }
    }
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const mime = getExt(file.name) === '.png' ? 'image/png' : 'image/jpeg'
    return await new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(new File([blob], file.name, { type: blob.type }))
        else reject(new Error('Canvas conversion failed'))
      }, mime, 0.9)
    })
  } catch {
    return file
  }
}

function AuthenticatedThumbnail({ storedUrl, altText }) {
  const { fetchDocumentBlobUrl } = useContext(AuthContext)
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!storedUrl) return
    let blobUrl = null
    let alive = true
    fetchDocumentBlobUrl(storedUrl).then(url => {
      if (!alive) { if (url) URL.revokeObjectURL(url); return }
      blobUrl = url
      setSrc(url)
    })
    return () => {
      alive = false
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [storedUrl])

  if (!src) return <div className="mfu-thumb-placeholder" />
  return <img src={src} alt={altText} className="mfu-thumb-img" />
}

function DocIcon({ filename }) {
  const pdf = isPdf(filename)
  return (
    <svg viewBox="0 0 24 24" className={`mfu-doc-icon${pdf ? ' pdf' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      {pdf && <><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /><line x1="8" y1="9" x2="10" y2="9" /></>}
    </svg>
  )
}

function MultiFileUploader({
  slot, files, applicationId, onFilesChange, error,
  uploadDocument, removeDocument, openDocument, downloadCombinedPdf,
}) {
  const { fetchDocumentBlobUrl } = useContext(AuthContext)
  const [uploading, setUploading] = useState(false)
  const [localErrors, setLocalErrors] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [cardDragIndex, setCardDragIndex] = useState(null)
  const [cardDragOverIndex, setCardDragOverIndex] = useState(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const inputRef = useRef(null)

  const allErrors = [...localErrors, ...(error ? [error] : [])]

  const processFiles = async (fileList) => {
    const incoming = Array.from(fileList)
    const errs = []
    const valid = []

    for (const file of incoming) {
      if (isHeic(file)) {
        errs.push(`"${file.name}": HEIC/HEIF is not supported — convert to JPG or PNG first.`)
        continue
      }
      if (!ALLOWED_EXTS.has(getExt(file.name))) {
        errs.push(`"${file.name}": unsupported type. Allowed: PDF, Word, JPG, PNG, GIF, BMP, WebP.`)
        continue
      }
      if (file.size > MAX_SIZE) {
        errs.push(`"${file.name}": exceeds 10 MB limit.`)
        continue
      }
      valid.push(file)
    }

    setLocalErrors(errs)
    if (!valid.length) return

    if (!applicationId) {
      setLocalErrors(e => [...e, 'Complete a previous step first to save your application before uploading.'])
      return
    }

    setUploading(true)
    const uploaded = []
    const uploadErrs = []
    for (const file of valid) {
      try {
        const fixed = await fixExifAndResize(file)
        const result = await uploadDocument(applicationId, slot.id, fixed)
        uploaded.push(result)
      } catch (err) {
        uploadErrs.push(`"${file.name}": ${err.message || 'Upload failed'}`)
      }
    }
    if (uploadErrs.length) setLocalErrors(prev => [...prev, ...uploadErrs])
    if (uploaded.length) onFilesChange(slot.id, [...files, ...uploaded])
    setUploading(false)
  }

  const handleInputChange = (e) => { processFiles(e.target.files); e.target.value = '' }

  const handleZoneDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (cardDragIndex !== null) return
    processFiles(e.dataTransfer.files)
  }

  const handleRemove = (fileObj) => {
    if (applicationId && fileObj.filename) removeDocument(applicationId, fileObj.filename)
    onFilesChange(slot.id, files.filter(f => f.filename !== fileObj.filename))
  }

  // Card drag-to-reorder
  const onCardDragStart = (e, i) => {
    setCardDragIndex(i)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }
  const onCardDragOver = (e, i) => { e.preventDefault(); e.stopPropagation(); setCardDragOverIndex(i) }
  const onCardDrop = (e, toIndex) => {
    e.preventDefault(); e.stopPropagation()
    if (cardDragIndex !== null && cardDragIndex !== toIndex) {
      const reordered = [...files]
      const [item] = reordered.splice(cardDragIndex, 1)
      reordered.splice(toIndex, 0, item)
      onFilesChange(slot.id, reordered)
    }
    setCardDragIndex(null); setCardDragOverIndex(null)
  }
  const onCardDragEnd = () => { setCardDragIndex(null); setCardDragOverIndex(null) }

  const openLightbox = async (fileObj) => {
    if (!fileObj.url) return
    setLightboxSrc(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    const url = await fetchDocumentBlobUrl(fileObj.url)
    if (url) setLightboxSrc(url)
  }

  const closeLightbox = () => {
    setLightboxSrc(prev => { if (prev) URL.revokeObjectURL(prev); return null })
  }

  const handleCardClick = (fileObj) => {
    const name = fileObj.originalName || fileObj.filename || ''
    if (isImage(name)) openLightbox(fileObj)
    else if (fileObj.url) openDocument(fileObj.url)
  }

  return (
    <div className={`mfu-slot ${slot.required ? 'required' : 'optional'}`}>
      <div className="mfu-slot-header">
        <div className="mfu-title-row">
          <h3 className="mfu-title">{slot.title}</h3>
          {slot.required
            ? <span className="required-badge">Required</span>
            : <span className="optional-badge">Optional</span>
          }
          {files.length > 0 && (
            <span className="mfu-count">{files.length} file{files.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <p className="mfu-description">{slot.description}</p>
      </div>

      {files.length > 0 && (
        <div className="mfu-grid">
          {files.map((f, index) => {
            const name = f.originalName || f.filename || ''
            const img = isImage(name)
            return (
              <div
                key={f.filename || index}
                className={[
                  'mfu-card',
                  cardDragIndex === index ? 'dragging' : '',
                  cardDragOverIndex === index ? 'drag-target' : '',
                ].filter(Boolean).join(' ')}
                draggable
                onDragStart={e => onCardDragStart(e, index)}
                onDragOver={e => onCardDragOver(e, index)}
                onDrop={e => onCardDrop(e, index)}
                onDragEnd={onCardDragEnd}
              >
                <div className="mfu-card-thumb" onClick={() => handleCardClick(f)} title="Click to preview">
                  {img && f.url
                    ? <AuthenticatedThumbnail storedUrl={f.url} altText={name} />
                    : <DocIcon filename={name} />
                  }
                </div>
                <div className="mfu-card-footer">
                  <span className="mfu-card-name" title={name}>{name}</span>
                  <button type="button" className="mfu-card-remove" onClick={() => handleRemove(f)} title="Remove file">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div
        className={`mfu-drop-zone ${isDragOver ? 'drag-over' : ''} ${uploading ? 'is-uploading' : ''} ${files.length > 0 ? 'compact' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (cardDragIndex === null) setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleZoneDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
          onChange={handleInputChange}
          className="mfu-input"
        />
        {uploading ? (
          <><span className="upload-spinner" /><span className="mfu-zone-label">Uploading…</span></>
        ) : (
          <>
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="mfu-zone-label">
              {files.length > 0 ? 'Add more files' : 'Drop files here or click to browse'}
            </span>
            <span className="upload-hint">PDF, Word, or image — max 10 MB per file</span>
          </>
        )}
      </div>

      {files.length >= 2 && downloadCombinedPdf && applicationId && (
        <button type="button" className="mfu-combined-btn" onClick={() => downloadCombinedPdf(applicationId, slot.id)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download combined PDF
        </button>
      )}

      {allErrors.map((msg, i) => (
        <span key={i} className="error-text">{msg}</span>
      ))}

      {lightboxSrc && (
        <div className="mfu-lightbox" onClick={closeLightbox}>
          <button type="button" className="mfu-lightbox-close" onClick={closeLightbox}>×</button>
          <img
            src={lightboxSrc}
            className="mfu-lightbox-img"
            alt="Preview"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default MultiFileUploader
