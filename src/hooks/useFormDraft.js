import { useCallback, useRef, useState } from 'react';

const draftKey = userId => `hpair:profile-draft:v1:${userId}`;
// Persist answers only: never auth tokens, file bytes, or submission status.
const fields = new Set(['firstName', 'lastName', 'dateOfBirth', 'gender', 'nationality',
  'preferredLanguage', 'phone', 'phoneCountry', 'phoneCallingCode', 'addressLine1',
  'addressLine2', 'city', 'region', 'postalCode', 'country', 'organization', 'hasLinkedIn', 'linkedinUrl']);
const answersOnly = data => Object.fromEntries(Object.entries(data || {})
  .filter(([key, value]) => fields.has(key) && typeof value === 'string'));

const readDraft = userId => {
  if (!userId) return { data: {}, status: 'idle' };
  try {
    const raw = localStorage.getItem(draftKey(userId));
    if (!raw) return { data: {}, status: 'idle' };
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !saved.answers || typeof saved.answers !== 'object' || Array.isArray(saved.answers)) {
      return { data: {}, status: 'idle' };
    }
    return { data: answersOnly(saved.answers), status: 'restored' };
  } catch {
    return { data: {}, status: 'unavailable' };
  }
};

// The authenticated form is keyed by user ID, so each account gets fresh state.
export const useFormDraft = userId => {
  const [initial] = useState(() => readDraft(userId));
  const [formData, setData] = useState(initial.data);
  const [draftStatus, setStatus] = useState(initial.status);
  const current = useRef(initial.data);

  const setFormData = useCallback(update => {
    const next = answersOnly(typeof update === 'function' ? update(current.current) : update);
    current.current = next;
    setData(next);
    if (!userId) return;
    // Synchronous writes avoid losing a debounced edit when logging out or closing.
    try {
      localStorage.setItem(draftKey(userId), JSON.stringify({ version: 1, answers: next }));
      setStatus('saved');
    } catch {
      setStatus('unavailable');
    }
  }, [userId]);

  const clearDraft = useCallback(() => {
    current.current = {};
    setData({});
    try {
      if (userId) localStorage.removeItem(draftKey(userId));
      setStatus('idle');
    } catch {
      setStatus('unavailable');
    }
  }, [userId]);

  return { formData, setFormData, draftStatus, clearDraft };
};
