import React from 'react';
import CVUpload from '../fields/CVUpload';
import { validateProfile } from '../../utils/validateProfile';
import EditableSelect from '../fields/EditableSelect';
import PhoneField from '../fields/PhoneField';
import { getCountries } from 'libphonenumber-js';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
const nationalitySuggestions = getCountries()
  .map(country => regionNames.of(country))
  .sort((a, b) => a.localeCompare(b));
// Suggestions are a starting point; both inputs also accept custom values.
const languageSuggestions = [
  'af', 'am', 'ar', 'az', 'be', 'bg', 'bn', 'bs', 'ca', 'cs', 'cy', 'da',
  'de', 'el', 'en', 'es', 'et', 'eu', 'fa', 'fi', 'fil', 'fr', 'ga', 'gu',
  'ha', 'he', 'hi', 'hr', 'hu', 'hy', 'id', 'is', 'it', 'ja', 'jv', 'ka',
  'kk', 'km', 'kn', 'ko', 'ku', 'ky', 'lo', 'lt', 'lv', 'mk', 'ml', 'mn',
  'mr', 'ms', 'mt', 'my', 'ne', 'nl', 'no', 'or', 'pa', 'pl', 'ps', 'pt',
  'ro', 'ru', 'si', 'sk', 'sl', 'so', 'sq', 'sr', 'su', 'sv', 'sw', 'ta',
  'te', 'th', 'tr', 'uk', 'ur', 'uz', 'vi', 'yo', 'zh', 'yue', 'zu',
].map(language => languageNames.of(language)).sort((a, b) => a.localeCompare(b));

const sections = [
  { id: 'about-you', number: '01', label: 'About You', fields: ['firstName', 'lastName', 'nationality', 'preferredLanguage'] },
  { id: 'contact-details', number: '02', label: 'Contact', fields: ['phone', 'addressLine1', 'city', 'country'] },
  { id: 'your-background', number: '03', label: 'Background', fields: ['hasLinkedIn', 'linkedinUrl', 'cv'] },
];

// Presentation only: callers supply values, validation errors, and file handling.
const PersonalInfoStep = ({ formData, setFormData, errors = {}, onCVChange, cvFile = null, savedCVName = '', completionErrors }) => {
  // Completion uses the same requirements as submission validation.
  const incompleteFields = completionErrors ?? validateProfile(formData, cvFile, savedCVName);

  const handleInputChange = ({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const field = (name, label, { type = 'text', hint, optional = false, ...props } = {}) => (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label} {optional && <span className="optional-label">Optional</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete="off"
        value={formData[name] || ''}
        onChange={handleInputChange}
        className="form-input"
        aria-required={!optional}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-error` : hint ? `${name}-hint` : undefined}
        {...props}
      />
      {hint && <p className="field-hint" id={`${name}-hint`}>{hint}</p>}
      {errors[name] && <p className="form-error" id={`${name}-error`}>{errors[name]}</p>}
    </div>
  );

  return (
    <>
      <nav className="section-nav" aria-label="Form sections">
        {sections.map(section => {
          const complete = section.fields.every(name => !incompleteFields[name]);
          return <a
            key={section.id}
            href={`#${section.id}`}
            className={complete ? 'section-complete' : undefined}
            aria-label={`${section.number} ${section.label}, ${complete ? 'complete' : 'incomplete'}`}
            title={complete ? 'All required fields in this section are complete' : 'Required fields still to complete'}
          >
            <span className="section-completion-marker" aria-hidden="true">{complete ? '✓' : section.number}</span> {section.label}
          </a>;
        })}
      </nav>

      <section className="profile-section" id="about-you" aria-labelledby="about-title">
        <div className="section-heading">
          <span className="section-number" aria-hidden="true">01</span>
          <div><h2 id="about-title">About You</h2><p>So we know what to call you</p></div>
        </div>
        <div className="field-grid">
          {field('firstName', 'First Name', { placeholder: 'First Name' })}
          {field('lastName', 'Last Name', { placeholder: 'Last Name' })}
          {field('dateOfBirth', 'Date of Birth', { type: 'date', optional: true })}
          <div className="form-group">
            <label className="form-label" htmlFor="gender">Gender <span className="optional-label">Optional</span></label>
            <select id="gender" name="gender" value={formData.gender || ''} onChange={handleInputChange} className="form-input">
              <option value="">Select an option</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="self-described">Self-described</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
          <EditableSelect
            name="nationality"
            label="Nationality"
            value={formData.nationality || ''}
            options={nationalitySuggestions}
            onChange={value => setFormData(previous => ({ ...previous, nationality: value }))}
            error={errors.nationality}
            placeholder="Select or type a nationality"
            hint="Choose a country / territory, or type your nationality."
          />
          <EditableSelect
            name="preferredLanguage"
            label="Preferred Language"
            value={formData.preferredLanguage || ''}
            options={languageSuggestions}
            onChange={value => setFormData(previous => ({ ...previous, preferredLanguage: value }))}
            error={errors.preferredLanguage}
            placeholder="Select or type a language"
            hint="Choose a suggestion or enter another language."
          />
        </div>
      </section>

      <section className="profile-section" id="contact-details" aria-labelledby="contact-title">
        <div className="section-heading">
          <span className="section-number" aria-hidden="true">02</span>
          <div><h2 id="contact-title">Contact Details</h2><p>So we know how to find you</p></div>
        </div>
        <PhoneField formData={formData} setFormData={setFormData} error={errors.phone} />
        {field('addressLine1', 'Street Address Line 1', { placeholder: 'Street name and number' })}
        {field('addressLine2', 'Street Address Line 2', { optional: true, placeholder: 'Apartment or unit' })}
        <div className="field-grid">
          {field('city', 'City', {})}
          {field('region', 'State / Province / Region', { optional: true })}
          {field('postalCode', 'Postal Code', { optional: true })}
          <EditableSelect
            name="country"
            label="Country / Territory"
            value={formData.country || ''}
            options={nationalitySuggestions}
            onChange={value => setFormData(previous => ({ ...previous, country: value }))}
            error={errors.country}
            placeholder="Select or type a country"
          />
        </div>
      </section>

      <section className="profile-section" id="your-background" aria-labelledby="background-title">
        <div className="section-heading">
          <span className="section-number" aria-hidden="true">03</span>
          <div><h2 id="background-title">Your Background</h2><p>So we know what you've done before</p></div>
        </div>
        {field('organization', 'University or Organization', { optional: true, placeholder: 'Enter School or Organization Name' })}
        <div className="linkedin-question form-group" role="group" aria-labelledby="linkedin-question-label">
          <span className="form-label" id="linkedin-question-label">Do you have a LinkedIn profile?</span>
          <div className="choice-options">
            {['yes', 'no'].map(answer => (
              <label className="choice-option" key={answer}>
                <input
                  type="radio"
                  name="hasLinkedIn"
                  value={answer}
                  checked={formData.hasLinkedIn === answer}
                  required
                  data-invalid={!!errors.hasLinkedIn}
                  aria-describedby={errors.hasLinkedIn ? 'hasLinkedIn-error' : undefined}
                  onChange={() => setFormData(previous => {
                    const next = { ...previous, hasLinkedIn: answer };
                    if (answer === 'no') delete next.linkedinUrl;
                    return next;
                  })}
                />
                <span>{answer === 'yes' ? 'Yes' : 'No'}</span>
              </label>
            ))}
          </div>
        </div>
        {errors.hasLinkedIn && <p className="form-error linkedin-choice-error" id="hasLinkedIn-error">{errors.hasLinkedIn}</p>}
        <div
          className={`linkedin-reveal${formData.hasLinkedIn === 'yes' ? ' is-open' : ''}`}
          aria-hidden={formData.hasLinkedIn !== 'yes'}
        >
          <div className="linkedin-reveal-inner">
            {field('linkedinUrl', 'LinkedIn profile URL', {
              type: 'url',
              required: formData.hasLinkedIn === 'yes',
              disabled: formData.hasLinkedIn !== 'yes',
              'aria-required': formData.hasLinkedIn === 'yes',
              placeholder: 'https://www.linkedin.com/in/your-name',
              hint: 'Required when you select Yes. Enter the full URL to your profile.',
            })}
          </div>
        </div>
        <CVUpload savedName={savedCVName} file={cvFile} onChange={onCVChange} error={errors.cv} />
      </section>

      {/* <details className="review-note">
        <summary>Review your information</summary>
        <p>Take one last look before you submit. You can edit your details in the sections above.</p>
        <dl className="review-list">
          {[
            ['Name', [formData.firstName, formData.lastName].filter(Boolean).join(' ')],
            ['Nationality', formData.nationality],
            ['Language', formData.preferredLanguage],
            ['Phone', formatPhonePreview(formData)],
            ['Address', [formData.addressLine1, formData.addressLine2, formData.city, formData.region, formData.postalCode, formData.country].filter(Boolean).join(', ')],
            ['Organization', formData.organization],
            ...(formData.hasLinkedIn === 'yes' ? [['LinkedIn', formData.linkedinUrl]] : []),
            ['CV / résumé', cvFile?.name],
          ].map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>
          ))}
        </dl>
      </details> */}
    </>
  );
};

export default PersonalInfoStep;
