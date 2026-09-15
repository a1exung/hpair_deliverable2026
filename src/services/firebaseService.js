// Firebase service for form submissions
import {
  collection,
  doc,
  getDocs,
  getCountFromServer,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'formSubmissions';

const submissionErrorMessage = code => {
  if (code === 'permission-denied') return 'Your submission could not be saved because access was denied. Please try again later.';
  if (code === 'unauthenticated') return 'Please sign in again before submitting your information.';
  if (code === 'unavailable') return 'We couldn’t connect to save your information. Please check your connection and try again.';
  return 'We couldn’t save your submission. Please try again.';
};

// The CV is validated locally; only its filename is saved, never the file contents.
// One atomic Firestore batch saves the submission and its initial status history.
export const submitForm = async (formData, cvFile, userId, retainedCVName = '') => {
  if (!userId) return { success: false, code: 'unauthenticated', stage: 'validate', message: 'Please sign in before submitting.' };
  if (!(cvFile?.name || retainedCVName) || !/\.(pdf|doc|docx)$/i.test(cvFile?.name || retainedCVName) || (cvFile && cvFile.size > 5 * 1024 * 1024)) {
    return { success: false, code: 'invalid-cv', stage: 'validate', message: 'Please choose one PDF, DOC, or DOCX file up to 5 MB.' };
  }
  try {
    const existing = await getUserFormSubmissions(userId);
    if (!existing.success) return existing;
    const previous = existing.data.find(item => item.id === userId) || existing.data[0];
    const submissionRef = doc(db, COLLECTION_NAME, previous?.id || userId);
    const historyRef = doc(collection(submissionRef, 'statusHistory'));
    const batch = writeBatch(db);
    batch.set(submissionRef, {
      ...formData,
      userId,
      status: 'submitted',
      cvStored: false,
      cvName: cvFile?.name || retainedCVName,
      cvPath: null,
      cvUrl: null,
      submittedAt: previous?.submittedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(historyRef, {
      status: 'submitted',
      note: 'Form answers received. CV file not stored.',
      changedBy: userId,
      changedAt: serverTimestamp(),
    });
    await batch.commit();
    return {
      success: true,
      id: submissionRef.id,
      data: { ...formData, id: submissionRef.id, cvName: cvFile?.name || retainedCVName, status: 'submitted' },
      message: 'Form submitted successfully!',
    };
  } catch (error) {
    console.error('Error saving submission:', { code: error.code, message: error.message });
    return { success: false, code: error.code || 'unknown', stage: 'save-submission', message: submissionErrorMessage(error.code) };
  }
};

// Clear legacy records too, so an older submission cannot reappear after clearing.
export const clearUserSubmission = async userId => {
  if (!userId) return { success: false, message: 'Please sign in again.' };
  try {
    const result = await getUserFormSubmissions(userId);
    if (!result.success) return result;
    const refs = [];
    for (const record of result.data) {
      const parent = doc(db, COLLECTION_NAME, record.id);
      const history = await getDocs(collection(parent, 'statusHistory'));
      history.docs.forEach(entry => refs.push(doc(parent, 'statusHistory', entry.id)));
      refs.push(parent);
    }
    // Keep deletion atomic; do not partially clear a large history.
    if (refs.length > 450) return { success: false, message: 'This submission needs administrator help to clear its history.' };
    const batch = writeBatch(db);
    refs.forEach(ref => batch.delete(ref));
    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, message: 'We couldn’t clear your submission. Please try again.' };
  }
};

export const updateSubmissionStatus = async ({ submissionId, status, adminId, note = '' }) => {
  const submissionRef = doc(db, COLLECTION_NAME, submissionId);
  const historyRef = doc(collection(submissionRef, 'statusHistory'));
  const batch = writeBatch(db);

  batch.update(submissionRef, { status, updatedAt: serverTimestamp() });
  batch.set(historyRef, {
    status,
    note,
    changedBy: adminId,
    changedAt: serverTimestamp(),
  });

  await batch.commit();
  return { success: true, message: 'Submission status updated.' };
};

export const getSubmissionStatusHistory = async submissionId => {
  const historyQuery = query(
    collection(db, COLLECTION_NAME, submissionId, 'statusHistory'),
    orderBy('changedAt', 'desc')
  );
  const snapshot = await getDocs(historyQuery);
  return snapshot.docs.map(historyDoc => ({ id: historyDoc.id, ...historyDoc.data() }));
};

// Fetch only this user's history. Sort locally to avoid requiring a composite index.
export const getUserFormSubmissions = async (userId) => {
  if (!userId) return { success: false, message: 'Sign in to view submissions' };
  try {
    const snapshot = await getDocs(query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    ));
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    data.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching your submissions:', error.code, error.message);
    return { success: false, code: error.code, message: error.code === 'permission-denied'
      ? 'Your submission history could not be accessed. Please try again later.'
      : 'Your submission history isn’t available right now. You can try refreshing.' };
  }
};

// Get all form submissions (for admin viewing)
export const getFormSubmissions = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('submittedAt', 'desc'), 
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const submissions = [];
    
    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { 
      success: true, 
      data: submissions 
    };
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return { 
      success: false, 
      message: 'Failed to fetch submissions' 
    };
  }
};

// Get form submission count
export const getSubmissionCount = async () => {
  try {
    const countSnapshot = await getCountFromServer(collection(db, COLLECTION_NAME));
    return { 
      success: true, 
      count: countSnapshot.data().count
    };
  } catch (error) {
    console.error('Error getting submission count:', error);
    return { 
      success: false, 
      message: 'Failed to get submission count' 
    };
  }
};

const firebaseService = {
  submitForm,
  getFormSubmissions,
  getSubmissionCount,
  updateSubmissionStatus,
  getSubmissionStatusHistory,
};

export default firebaseService;
