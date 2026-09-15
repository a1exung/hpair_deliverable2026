import React, { useEffect, useRef, useState, useMemo } from 'react';

// A shared editable combobox: suggestions never restrict a user's own answer.
const EditableSelect = ({ name, label, value, options, onChange, hint, error, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  // Normalize the static suggestions once; unrelated form edits reuse the matches.
  const searchableOptions = useMemo(
    () => options.map(option => ({ option, searchText: option.toLocaleLowerCase() })),
    [options]
  );
  const matches = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return searchableOptions
      .filter(({ searchText }) => searchText.includes(search))
      .map(({ option }) => option);
  }, [searchableOptions, query]);
  const listId = `${name}-options`;

  useEffect(() => {
    const list = listRef.current;
    const option = list?.children[activeIndex];
    if (!option) return;
    // Scroll only the menu, without moving the page underneath it.
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
    }
  }, [activeIndex]);

  const choose = option => {
    onChange(option);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = event => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(index => {
        if (!matches.length) return -1;
        if (index < 0) return direction === 1 ? 0 : matches.length - 1;
        return (index + direction + matches.length) % matches.length;
      });
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (activeIndex >= 0 && matches[activeIndex]) choose(matches[activeIndex]);
      else setOpen(false);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="form-group editable-select" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <label className="form-label" htmlFor={name}>{label}</label>
      <div className="editable-select-control">
        <input
          ref={inputRef}
          id={name}
          name={name}
          className="form-input"
          role="combobox"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={`${name}-${error ? 'error' : 'hint'}`}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? `${name}-option-${activeIndex}` : undefined}
          onFocus={() => { setQuery(''); setActiveIndex(-1); }}
          onClick={() => setOpen(true)}
          onChange={event => {
            onChange(event.target.value);
            setQuery(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="editable-select-toggle"
          tabIndex={-1}
          aria-label={`${open ? 'Close' : 'Show'} ${label.toLowerCase()} suggestions`}
          aria-controls={listId}
          aria-expanded={open}
          onMouseDown={event => event.preventDefault()}
          onClick={() => {
            inputRef.current?.focus();
            setQuery('');
            setActiveIndex(-1);
            setOpen(!open);
          }}
        ><span aria-hidden="true">⌄</span></button>
        {open && (
          <div className="editable-select-menu">
            <ul id={listId} role="listbox" aria-label={label} ref={listRef}>
              {matches.map((option, index) => (
                <li
                  id={`${name}-option-${index}`}
                  key={option}
                  role="option"
                  aria-selected={option === value}
                  className={index === activeIndex ? 'is-active' : ''}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  <span>{option}</span>
                  {option === value && <span aria-hidden="true">✓</span>}
                </li>
              ))}
            </ul>
            {!matches.length && <p className="editable-select-empty" role="status">No matching suggestions. You can keep your typed answer.</p>}
          </div>
        )}
      </div>
      <p className="field-hint" id={`${name}-hint`}>{hint}</p>
      {error && <p className="form-error" id={`${name}-error`}>{error}</p>}
    </div>
  );
};

export default EditableSelect;
