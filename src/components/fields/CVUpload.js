import React, { useRef, useState } from 'react';

const CVUpload = ({ file, savedName = '', onChange = () => {}, error }) => {
  const [fileError, setFileError] = useState('');
  const [isDragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const dragDepth = useRef(0);

  const selectFiles = files => {
    if (files.length !== 1) {
      setFileError(files.length ? 'Please choose one CV at a time.' : 'No file was received. Drag a file from your computer, or click to browse.');
      return;
    }
    const selected = files[0];
    if (!/\.(pdf|doc|docx)$/i.test(selected.name)) {
      setFileError('Please choose a PDF, DOC, or DOCX file.');
    } else if (selected.size > 5 * 1024 * 1024) {
      setFileError('Your CV must be 5 MB or smaller.');
    } else {
      setFileError('');
      onChange(selected);
    }
  };

  const handleDrop = event => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setDragActive(false);
    const transfer = event.dataTransfer;
    const files = Array.from(transfer.files || []);
    // Some drag sources expose files only through DataTransferItemList.
    const received = files.length ? files : Array.from(transfer.items || [])
      .filter(item => item.kind === 'file').map(item => item.getAsFile()).filter(Boolean);
    selectFiles(received);
  };
  const message = fileError || error;

  return (
    <div
      className="form-group cv-drop-section"
      onDragEnterCapture={event => {
        event.preventDefault();
        dragDepth.current += 1;
        setDragActive(true);
      }}
      onDragOverCapture={event => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeaveCapture={event => {
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragActive(false);
      }}
      onDropCapture={handleDrop}
    >
      <span className="form-label" id="cv-label">CV / Resume</span>
      {file || savedName ? (
        <div className="cv-upload cv-uploaded" role="status" aria-live="polite">
          <div className="upload-symbol" aria-hidden="true">✓</div>
          <div className="cv-selected">
            <strong>{file ? 'CV uploaded' : 'Saved CV filename'}</strong>
            <small>{file ? `${file?.name || savedName} · ${(file.size / 1024).toFixed(1)} KB` : savedName}</small>
          </div>
          <button type="button" className="cv-remove" onClick={() => { onChange(null); setFileError(''); }} aria-label={`Remove ${file?.name || savedName}`}>Remove</button>
        </div>
      ) : (
      <div
        className={`cv-upload${isDragActive ? ' is-dragging' : ''}`}
        role="button"
        data-invalid={!!message}
        tabIndex={0}
        aria-labelledby="cv-label cv-title"
        aria-describedby={message ? 'cv-error' : 'cv-hint'}
        onClick={() => inputRef.current?.click()}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}

      >
        <input
          ref={inputRef}
          className="cv-native-input"
          id="cv"
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx"
          tabIndex={-1}
          aria-label="Choose your CV"
          onClick={event => event.stopPropagation()}
          onChange={event => {
            if (event.target.files.length) selectFiles(Array.from(event.target.files));
            event.target.value = '';
          }}
        />
        <div className="upload-symbol" aria-hidden="true">↑</div>
        <div>
          <strong id="cv-title">{isDragActive ? 'Drop your CV here' : 'Drop your CV here, or click to browse'}</strong>
          <p className="field-hint" id="cv-hint">One PDF, DOC, or DOCX · Up to 5 MB</p>
        </div>
      </div>
      )}
      {message && <p className="form-error" id="cv-error" role="alert">{message}</p>}
    </div>
  );
};

export default CVUpload;
