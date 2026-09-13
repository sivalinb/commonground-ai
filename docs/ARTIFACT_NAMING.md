# Artifact names and provenance

Project labels, paths, scripts, and downloadable reports use descriptive capability names. Recorded results retain their metrics, case IDs, predictions, model identities, timestamps, and release decisions. Textual artifact labels and path metadata have been normalized, and checksums refer to those normalized files; this is not a new experiment.

The [provenance ledger](artifact-naming-provenance.json) records the source commit, original Git blob and SHA-256, and normalized SHA-256 for each edited artifact. The [original source snapshot](https://github.com/sivalinb/commonground-ai/tree/badd4ebdb4c50f1826e31936f4a87f6581e22fb8) remains available for byte-for-byte historical verification.

Dataset and experiment labels in the project are descriptive aliases. Historical external records are still identified by their recorded IDs and URLs; changing a local label does not rename a record in an external service. Recorded screenshots and videos retain their original on-screen presentation.
