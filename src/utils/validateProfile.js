// Keep these requirements aligned with the visible optional labels.
const required = {
  firstName: 'Please enter your first name.',
  lastName: 'Please enter your last name.',
  nationality: 'Please select or enter your nationality.',
  preferredLanguage: 'Please select or enter your preferred language.',
  phone: 'Please enter your phone number.',
  addressLine1: 'Please enter your street address.',
  city: 'Please enter your city.',
  country: 'Please enter your country or territory.',
};
const requiredEntries = Object.entries(required);

export const validateProfile = (data, cvFile, savedCVName = '') => {
  const errors = {};
  requiredEntries.forEach(([field, message]) => {
    if (!String(data[field] || '').trim()) errors[field] = message;
  });
  if (!['yes', 'no'].includes(data.hasLinkedIn)) errors.hasLinkedIn = 'Please choose Yes or No.';
  if (data.hasLinkedIn === 'yes') {
    if (!String(data.linkedinUrl || '').trim()) {
      errors.linkedinUrl = 'Please add your LinkedIn profile link.';
    } else {
      try {
        const url = new URL(data.linkedinUrl);
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch {
        errors.linkedinUrl = 'Please enter a full web address, starting with https://.';
      }
    }
  }
  if (!cvFile && !savedCVName) errors.cv = 'Please choose or drop your CV here.';
  return errors;
};
