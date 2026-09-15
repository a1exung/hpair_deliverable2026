import React from 'react';

const sections = [
  ['About you', [['firstName', 'First name'], ['lastName', 'Last name'], ['dateOfBirth', 'Date of birth'], ['gender', 'Gender'], ['nationality', 'Nationality'], ['preferredLanguage', 'Preferred language']]],
  ['Contact details', [['phoneDisplay', 'Phone'], ['addressLine1', 'Street address'], ['addressLine2', 'Address line 2'], ['city', 'City'], ['region', 'State / region'], ['postalCode', 'Postal code'], ['country', 'Country']]],
  ['Background', [['organization', 'Organization'], ['hasLinkedIn', 'LinkedIn profile'], ['linkedinUrl', 'LinkedIn link'], ['cvName', 'CV filename']]],
];

export default function SubmissionSummary({ submission }) {
  const values = { ...submission, phoneDisplay: [submission.phoneCallingCode, submission.phone].filter(Boolean).join(' '), hasLinkedIn: submission.hasLinkedIn === 'yes' ? 'Yes' : 'No' };
  return <div className="submission-summary">{sections.map(([title, fields]) => <section className="profile-section" key={title}>
    <h2>{title}</h2>
    <dl className="submitted-fields">{fields.filter(([key]) => key !== 'linkedinUrl' || submission.hasLinkedIn === 'yes').map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{values[key] || 'Not provided'}</dd></div>)}</dl>
  </section>)}</div>;
}
