# LifeSure Underwriter Vercel App

One Vercel project with two routes:

- `/underwriter` — underwriter workbench
- `/demo-control` — simulated external prescription and evidence-provider events

## Configure

Set this Vercel server-side environment variable:

```text
UNDERWRITER_API_BASE_URL=https://<your-condense-underwriting-readiness-service>
```

Do not use `NEXT_PUBLIC_`.

## Expected backend APIs

- `GET /applications`
- `GET /application/:applicationId`
- `POST /application/:applicationId/demo/prescription-response`
- `POST /application/:applicationId/evidence/:type/received`

## Demo

1. Complete Jane's applicant journey in the applicant Vercel app.
2. Open `/underwriter` and `/demo-control` side-by-side.
3. After consent, expect `PENDING_EXTERNAL_DATA`.
4. Demo Control → Send Prescription Response.
5. Expect `PENDING_EVIDENCE` with MEDICAL_EXAM + APS.
6. Send Medical Exam.
7. Send APS.
8. Expect `READY_WITH_WARNINGS`.

The workbench polls every 2 seconds so changes should appear automatically.
