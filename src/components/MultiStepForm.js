import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FiPrinter } from 'react-icons/fi';
import { useFormDraft } from '../hooks/useFormDraft';
import { validateProfile } from '../utils/validateProfile';
import SubmissionSummary from './SubmissionSummary';
import PersonalInfoStep from './steps/PersonalInfoStep';
import { submitForm, getUserFormSubmissions, clearUserSubmission } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/authService';

const NO_ERRORS = {};

const MultiStepForm = () => {
  const { user, userId } = useAuth();
  const { formData, setFormData, draftStatus, clearDraft } = useFormDraft(userId);
  // The CV stays in memory; only its filename is persisted with the form answers.
  const [cvFile, setCVFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submission, setSubmission] = useState(null);
  const [view, setView] = useState('form');
  const [savedCVName, setSavedCVName] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const busy = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const formRef = useRef(null);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  // Share one validation result between submission and section completion.
  const currentErrors = useMemo(
    () => validateProfile(formData, cvFile, savedCVName),
    [formData, cvFile, savedCVName]
  );
  const validationErrors = submitAttempts ? currentErrors : NO_ERRORS;
  const errorCount = Object.keys(validationErrors).length;

  useEffect(() => {
    if (!submitAttempts) return;
    const firstInvalid = formRef.current?.querySelector('[aria-invalid="true"]:not([disabled]), [data-invalid="true"]');
    firstInvalid?.focus({ preventScroll: true });
    firstInvalid?.scrollIntoView?.({ block: 'center' });
  }, [submitAttempts]);

  const handleLogout = async () => {
    await signOutUser();
  };

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const submissionsResult = await getUserFormSubmissions(userId);
      if (submissionsResult.success) {
        const saved = submissionsResult.data.find(item => item.id === userId) || submissionsResult.data[0] || null;
        setSubmission(saved);
        setView(saved ? 'saved' : 'form');
      } else {
        setError(submissionsResult.message);
      }
    } catch (err) {
      setError('Failed to load submissions');
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    setSubmitMessage('');
    setSubmitAttempts(attempts => attempts + 1);
    if (Object.keys(currentErrors).length) return;
    busy.current = true;
    setIsSubmitting(true);
    
    try {
      const result = await submitForm(formData, cvFile, userId, savedCVName);
      
      if (result.success) {
        setSubmission(result.data || { ...formData, cvName: cvFile?.name || savedCVName });
        setView('success');
        setSavedCVName('');
        // Reset form
        clearDraft();
        setCVFile(null);
        setSubmitAttempts(0);

      } else {
        setSubmitMessage(result.message);
      }
    } catch (error) {
      setSubmitMessage('An error occurred. Please try again.');
      console.error('Submit error:', error);
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (view !== 'success') return;
    const timer = setTimeout(() => setView('saved'), 1600);
    return () => clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    document.getElementById('profile-title')?.focus({ preventScroll: true });
  }, [view]);

  const editSubmission = () => {
    if (!Object.keys(formData).length) setFormData(submission);
    setSavedCVName(submission.cvName || '');
    setSubmitMessage('');
    setConfirmClear(false);
    setView('form');
  };

  const clearSubmission = async () => {
    if (busy.current) return;
    busy.current = true;
    setIsSubmitting(true);
    setSubmitMessage('');
    try {
      const result = await clearUserSubmission(userId);
      if (!result.success) { setSubmitMessage(result.message); return; }
      clearDraft();
      setSubmission(null);
      setCVFile(null);
      setSavedCVName('');
      setSubmitAttempts(0);
      setConfirmClear(false);
      setView('form');
    } catch {
      setSubmitMessage('We couldn’t clear your submission. Please try again.');
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className={`form-container${view === 'saved' && !loading && !error ? ' printable-response' : ''}`}>
        <div className="form-heading">
          <div>
            <p className="eyebrow" role={view === 'saved' ? 'heading' : undefined} aria-level={view === 'saved' ? 1 : undefined} id={view === 'saved' ? 'profile-title' : undefined} tabIndex={view === 'saved' ? -1 : undefined}>{view === 'saved' ? 'Your HPAIR profile' : 'YOUR HPAIR PROFILE'}</p>
            {view !== 'saved' && <h1 id="profile-title" tabIndex={-1}>{view === 'success' ? 'Submission successful' : submission ? 'Edit your information.' : 'Let’s get to know you.'}</h1>}
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            Logout
          </button>
        </div>
        <div className="page-description-row">
        <p className="page-description">{view === 'saved' ? 'Your information is saved. You can review, edit, or clear it below.' : view === 'success' ? 'Thank you. Your HPAIR profile has been saved.' : 'Tell us about yourself and how to reach you. Fields are required unless marked optional.'}</p>
        {view === 'saved' && !loading && !error && <button type="button" className="print-icon-button" onClick={() => window.print()} aria-label="Print / Save as PDF" title="Print / Save as PDF"><FiPrinter aria-hidden="true" /></button>}
        </div>
        
        <div className="account-strip">
          <span>Signed in as <strong>{user.email}</strong></span>
        </div>

        {loading ? <p role="status">Loading your information…</p> : error ? <div role="status"><p>{error}</p><button className="btn btn-secondary" onClick={loadSubmissions}>Try again</button></div> : view === 'success' ? (
          <div className="submission-success" role="status"><span aria-hidden="true">✓</span><p>Your information is ready to review.</p><button className="btn btn-secondary" onClick={() => setView('saved')}>View submission</button></div>
        ) : view === 'saved' ? <>
          <SubmissionSummary submission={submission} />
          {submitMessage && <p className="validation-summary" role="status">{submitMessage}</p>}
          {confirmClear ? <div className="validation-summary"><strong>Clear your submission?</strong><p>This removes your saved information and draft. You can fill out a new form afterwards.</p><div className="submission-buttons"><button className="btn btn-primary" disabled={isSubmitting} onClick={clearSubmission}>{isSubmitting ? 'Clearing…' : 'Yes, clear submission'}</button><button className="btn btn-secondary" disabled={isSubmitting} onClick={() => setConfirmClear(false)}>Keep submission</button></div></div> : <div className="submission-buttons"><button className="btn btn-primary" onClick={editSubmission}>Edit submission</button><button className="btn btn-secondary" onClick={() => setConfirmClear(true)}>Clear submission</button></div>}
        </> : <>
        <p className="draft-status" role="status" aria-live="polite">
          {draftStatus === 'restored'
            ? (savedCVName ? 'Your draft edits are restored.' : 'Your draft is restored. Please select your CV again before submitting.')
            : draftStatus === 'saved'
              ? 'Draft saved on this browser.'
              : draftStatus === 'unavailable'
                ? 'Draft saving is unavailable in this browser. Keep this page open to retain your answers.'
                : 'Your answers save automatically on this browser.'}
        </p>

        <form ref={formRef} noValidate autoComplete="off" onSubmit={handleSubmit} className="profile-form">
          <PersonalInfoStep 
            errors={validationErrors}
            completionErrors={currentErrors}
            formData={formData} 
            cvFile={cvFile}
            savedCVName={savedCVName}
            onCVChange={file => { setCVFile(file); setSavedCVName(''); }}
            setFormData={setFormData} 
          />
          
          {errorCount > 0 && (
            <div className="validation-summary" role="status" aria-live="polite">
              <strong>A few details still need your attention.</strong>
              <p>Please check {errorCount === 1 ? 'the highlighted field' : `the ${errorCount} highlighted fields`} above. Your answers are still here.</p>
            </div>
          )}
          {submitMessage && (
            <div className={`submit-message ${submitMessage.includes('successfully') ? 'success' : 'error'}`} role="status">
              {submitMessage}
            </div>
          )}
          
          <div className="form-actions profile-actions">
            {submission && <button type="button" className="btn btn-secondary" disabled={isSubmitting} onClick={() => { setSubmitMessage(''); setSubmitAttempts(0); setView('saved'); }}>Cancel editing</button>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : submission ? 'Save changes' : 'Submit information'}
            </button>
          </div>
        </form>

        </>}
      </div>
    </div>
  );
};

export default MultiStepForm;
