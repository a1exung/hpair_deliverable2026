# HPAIR form UI handoff

Current behavior: inline validation is wired up, the review panel has been disabled, and submissions save answers to Firestore only. CV selection is local; only the filename is persisted, not the file contents. See `FIREBASE-SETUP.md` for the current setup. The implementation notes below describe the earlier UI handoff.

The UI is integrated into the existing React app. Login/sign-up keep the 50/50 photo layout; authenticated pages transition to 40/60. Mobile stacks the photo and form. All colors live in `src/index.css`.

## Form structure

`src/components/steps/PersonalInfoStep.js` renders three sections, native section links, a CV picker, and an expandable review. Text inputs use the existing `formData` / `setFormData` props. No wizard or artificial completion percentage is implied.

- About you: firstName, lastName, dateOfBirth, gender, nationality, preferredLanguage.
- Contact: phone, addressLine1, addressLine2, city, region, postalCode, country.
- Background: organization, linkedinUrl, CV.

Names, nationality, language, phone, street, city, country, and CV are visually required. Birth date, gender, organization, address line 2, region, and postal code are optional. LinkedIn uses a required Yes/No question; choosing Yes reveals a URL input with native required/URL checks. Choosing No removes the URL from form data and the review. Regional address validation is a product decision for implementation; avoid requiring US-only formats.

## React work remaining

1. **Validation:** pass an `errors` object keyed by field name into PersonalInfoStep. Error messages and invalid-field styling are prepared. Implement touched state, real-time validation, invalid-submit prevention, and focus on the first invalid field. `aria-required` communicates intent but does not enforce validation.
2. **CV:** pass `onCVChange` and `cvFile`. Drag-and-drop and picker selection now validate one PDF/DOC/DOCX up to 5 MB. The parent keeps the selected File in React state, with filename review and removal. Storage upload is still not implemented. Keep File objects separate from Firestore form data. Cloud upload is intentionally omitted for this deliverable. Reset the picker after a successful submission.
3. **Submission:** the original Firebase handler remains; text fields already enter its formData payload, but validation and CV persistence are not connected. Do not treat the existing success message as confirmation of a CV upload. Add a distinct status state instead of deriving styling from message text, and handle upload/submit failures and duplicate submissions.
4. **Review:** the expandable readback reflects text values. The selected cvFile name is displayed automatically. Add dates/gender to the summary if you retain those optional inputs.
5. **Creative enhancement:** the review panel is provided as a usability improvement. A downloadable summary or a recoverable draft would be a stronger bonus. Add it only with actual behavior; no fake saved/delivery indicators are displayed.
6. **Data access:** existing submission history still fetches all records and filters in the browser. Query by authenticated user and enforce ownership through Firebase rules before release.

## Checks to perform when wiring behavior

- Empty/invalid submission, valid submission, backend error, and retry.
- Missing, oversized, unsupported, replaced, and successfully uploaded CV.
- Keyboard focus, associated error text, and mobile layout.
- Confirm login/logout transitions and reduced-motion behavior.

This is a UI scaffold, not a completed functional deliverable. Existing authentication and Firebase service code have not been replaced.

## Phone selector

`PhoneField` uses libphonenumber-js country/calling-code metadata and native flag emoji. Countries sharing a code remain distinct choices. It defaults to the United States (+1), with no location detection. The selector and number input set `phoneCountry` (ISO country), `phoneCallingCode` (with +), and `phone` (national number). The review includes the chosen prefix. Normalize and validate these into an international number when implementing submission; formatting the review is not validation. Country names remain visible on platforms without flag emoji support.

## Autosaved drafts

Answers are saved synchronously to localStorage under `hpair:profile-draft:v1:<Firebase UID>` on every edit. Returning to the same account on the same browser restores them; another account gets a separate draft. The authenticated form is keyed by UID to reset in-memory state on account changes. A successful submission removes only that account's draft; failed submissions leave it intact. CV Files are not persisted in drafts and must be reselected. This is browser-local persistence, not cross-device sync or Firestore draft storage. Clearing browser data removes drafts. The UI reports when local storage is unavailable.
