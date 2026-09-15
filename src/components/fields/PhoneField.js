import React from 'react';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
// Reuse the same option elements while the selected value remains controlled.
const countryOptions = getCountries()
  .map(country => ({
    country,
    name: countryNames.of(country),
    code: getCountryCallingCode(country),
    flag: String.fromCodePoint(...[...country].map(letter => 127397 + letter.charCodeAt(0))),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'))
  .map(option => (
    <option key={option.country} value={option.country}>
      {option.flag} {option.name} (+{option.code})
    </option>
  ));

export const formatPhonePreview = (formData) => formData.phone
  ? `+${getCountryCallingCode(formData.phoneCountry || 'US')} ${formData.phone}`
  : '';

const PhoneField = ({ formData, setFormData, error }) => {
  const country = formData.phoneCountry || 'US';

  // Keep the selection and national number separate for later validation.
  const updatePhone = (nextCountry, number) => {
    setFormData(previous => ({
      ...previous,
      phoneCountry: nextCountry,
      phoneCallingCode: `+${getCountryCallingCode(nextCountry)}`,
      phone: number,
    }));
  };

  return (
    <fieldset className="phone-field form-group">
      <legend className="form-label">Phone Number</legend>
      <div className="phone-input-row">
        <div className="phone-country">
          <label className="phone-sublabel" htmlFor="phone-country">Code</label>
          <div className="calling-code-select">
          <select
            id="phone-country"
            name="phoneCountry"
            aria-label="Country and calling code"
            className="form-input"
            value={country}
            onChange={event => updatePhone(event.target.value, formData.phone || '')}
          >
            {countryOptions}
          </select>
            <span className="calling-code-value" aria-hidden="true">
              +{getCountryCallingCode(country)}
              <span className="calling-code-chevron">⌄</span>
            </span>
          </div>
        </div>
        <div className="phone-national">
          <label className="phone-sublabel" htmlFor="phone">Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="off"
            className="form-input"
            value={formData.phone || ''}
            onChange={event => updatePhone(country, event.target.value)}
            placeholder="Your phone number"
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'phone-error' : 'phone-hint'}
          />
        </div>
      </div>
      <p className="field-hint" id="phone-hint">Choose your calling code, then enter your number without the country code.</p>
      {error && <p className="form-error" id="phone-error">{error}</p>}
    </fieldset>
  );
};

export default PhoneField;
