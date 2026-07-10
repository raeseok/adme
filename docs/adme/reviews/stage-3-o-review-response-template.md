# Stage 3-O External Review Response Template

Status: TEMPLATE ONLY. Do not place real names, contact details, personal data, account data, provider secrets, or external answers in fixtures.

Use one record per question response.

```json
{
  "questionId": "",
  "reviewerOrganization": "",
  "reviewerRole": "",
  "reviewerNameOrMaskedReference": "",
  "requestedAt": "",
  "respondedAt": "",
  "answerSummary": "",
  "authoritativeSource": "",
  "assumptions": "",
  "jurisdiction": "",
  "effectiveDate": "",
  "expiryOrReviewDate": "",
  "followUpRequired": false,
  "followUpQuestions": [],
  "affectedSchemaObjects": [],
  "affectedPolicies": [],
  "affectedUI": [],
  "affectedOperations": [],
  "decisionRecommendation": "",
  "acceptedByBusinessOwner": false,
  "acceptedAt": "",
  "evidenceReference": ""
}
```

Recording rules:

- `questionId` must match `apps/web/src/lib/compliance/stage3o-external-review-question-pack.ts`.
- `reviewerNameOrMaskedReference` should use a masked internal reference unless a real name is necessary and approved for the evidence store.
- `answerSummary` must summarize an actual received answer only after external response is received.
- `acceptedByBusinessOwner` is a later owner decision and remains false until explicitly accepted.
- `evidenceReference` should point to the approved evidence location, not embed sensitive content.
