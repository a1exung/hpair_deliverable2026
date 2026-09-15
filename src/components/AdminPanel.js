import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFormSubmissions, getSubmissionCount, updateSubmissionStatus } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/authService';

const AdminPanel = () => {
  const [submissions, setSubmissions] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusDrafts, setStatusDrafts] = useState({});
  const [noteDrafts, setNoteDrafts] = useState({});
  const [savingId, setSavingId] = useState('');
  const { user, userId: currentUserId } = useAuth();

  const handleLogout = async () => {
    await signOutUser();
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const [submissionsResult, countResult] = await Promise.all([
        getFormSubmissions(),
        getSubmissionCount()
      ]);

      if (submissionsResult.success) {
        // Show all submissions (admin view)
        setSubmissions(submissionsResult.data);
      } else {
        setError(submissionsResult.message);
      }

      if (countResult.success) {
        setSubmissionCount(countResult.count);
      }
    } catch (err) {
      setError('Failed to load submissions');
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const saveStatus = async submission => {
    const status = statusDrafts[submission.id] || submission.status || 'submitted';
    const note = noteDrafts[submission.id] || '';
    try {
      setSavingId(submission.id);
      setError('');
      const result = await updateSubmissionStatus({
        submissionId: submission.id,
        status,
        note,
        adminId: currentUserId,
      });
      if (!result.success) setError(result.message);
      else await loadSubmissions();
    } catch (err) {
      setError('Failed to update submission status');
      console.error('Error updating submission status:', err);
    } finally {
      setSavingId('');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="form-container">
          <h2>Loading submissions...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-container">
        <div className="form-heading">
          <h1>Admin Panel - All Submissions</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link 
              to="/"
              className="btn btn-secondary"
              style={{ fontSize: '14px', padding: '8px 16px', textDecoration: 'none' }}
            >
              Back to Form
            </Link>
            <button 
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ fontSize: '14px', padding: '8px 16px' }}
            >
              Logout
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--color-surface-muted)', borderRadius: '8px' }}>
          <p><strong>Logged in as:</strong> {user.email}</p>
          <p><strong>Total submissions:</strong> {submissionCount}</p>
          <p><strong>Showing all submissions from all users</strong></p>
        </div>

        
        {error && (
          <div className="submit-message error">
            {error}
          </div>
        )}

        <button 
          onClick={loadSubmissions} 
          className="btn btn-primary"
          style={{ marginBottom: '20px' }}
        >
          Refresh
        </button>

        {submissions.length === 0 ? (
          <p>No submissions yet.</p>
        ) : (
          <div className="submissions-list">
            {submissions.map((submission) => (
              <div key={submission.id} className="submission-item">
                <div className="submission-header">
                  <h3>Submission #{submission.id.slice(-8)}</h3>
                  <span className="submission-date">
                    {formatDate(submission.submittedAt)}
                  </span>
                </div>
                <div className="submission-details">
                  <p><strong>User ID:</strong> {submission.userId}</p>
                  <p><strong>Name:</strong> {submission.firstName} {submission.lastName}</p>
                  <p><strong>Date of Birth:</strong> {submission.dateOfBirth}</p>
                  <p><strong>Gender:</strong> {submission.gender}</p>
                  {submission.cvUrl && <p><a href={submission.cvUrl} target="_blank" rel="noreferrer">Download CV</a></p>}
                  <div className="submission-status-controls">
                    <label htmlFor={`status-${submission.id}`}>Status</label>
                    <select
                      id={`status-${submission.id}`}
                      value={statusDrafts[submission.id] || submission.status || 'submitted'}
                      onChange={event => setStatusDrafts(previous => ({ ...previous, [submission.id]: event.target.value }))}
                    >
                      {['submitted', 'under_review', 'accepted', 'rejected', 'waitlisted'].map(status => (
                        <option key={status} value={status}>{status.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Optional reviewer note"
                      value={noteDrafts[submission.id] || ''}
                      onChange={event => setNoteDrafts(previous => ({ ...previous, [submission.id]: event.target.value }))}
                    />
                    <button type="button" className="btn btn-primary" disabled={savingId === submission.id} onClick={() => saveStatus(submission)}>
                      {savingId === submission.id ? 'Saving...' : 'Save status'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
