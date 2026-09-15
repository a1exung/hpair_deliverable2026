# Firebase setup: form answers only

The app keeps Firebase Authentication and Firestore. The CV picker and drag-and-drop UI remain unchanged, but the selected file stays in React memory. On submit, only the filename is saved; file contents, size, and type are not saved. There is no Firebase Storage or Supabase request.

New submissions use the account UID as the document ID. Further saves update that record; accounts with older records reuse their most recent record. The service uses one Firestore batch to save the answers and a status-history entry. A failed write returns an error; it does not claim success. No Storage bucket or billing upgrade is needed for this flow, subject to Firestore's free-plan quotas.

## Publish the matching Firestore rules

`firestore.rules` permits users to query their own records, create a submission at their UID, edit their existing submission, and delete their submission and history. Other users cannot access those records. Older published rules may reject reads or the new edit/clear flow; changing the local file does not publish it.

In the Firebase console, select `hpair-deliverable-7a73d`, confirm that the default Firestore database exists, then publish the contents of `firestore.rules` under Firestore Database → Rules. Alternatively, with Firebase CLI installed and signed in:

```sh
firebase deploy --only firestore:rules --project hpair-deliverable-7a73d
```

Cloud rules have not been deployed by this task. `firebase.json` now deploys only Firestore rules. `storage.rules` remains an unused historical file.

## Verify

- Sign in, complete the fields, and select a CV.
- Submit: Firestore receives answers and status history, and the CV filename, but no file contents.
- Submit: a brief success screen leads to a read-only summary.
- Refresh or sign back in: the summary appears instead of a fresh form.
- Edit: saved answers and the CV filename are retained; Save changes updates the existing record.
- Clear: confirm inline to delete saved records and history and remove the local draft. Older records are also cleared so they cannot reappear. A failed clear leaves the current page and draft intact.
- Use another account: it should not read the first user's records.

The file-selection interaction is a demo, not a server-side CV upload. Mention this limitation in the deliverable documentation/interview. No admin route is currently connected; the existing AdminPanel requires a trusted admin claim if wired up later.

## If reading is denied

The app queries `formSubmissions` with `where('userId', '==', user.uid)` after authentication loads. The matching read rule checks that same ownership field. A `permission-denied` response is not an empty result and must not open a fresh form (that could hide an existing submission). Check the published rules in the default database of `hpair-deliverable-7a73d`. If they already match the local file, check App Check enforcement and the signed-in account/project before changing code. The app does not currently initialize App Check.

Use the manual verification steps above to check the deployed app. A successful local build does not prove that the published Firestore rules permit live operations.
