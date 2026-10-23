# Structured handoffs v1

[简体中文](../STRUCTURED_HANDOFF.md) | [English](STRUCTURED_HANDOFF.md)

October 21, 2026: local validation and queuing are implemented, not deployed or accepted with real peer models. This is an AB content schema, not A2A or a new network protocol.

Types: test_report, clarification, proposal, fix_report, retest_result. Common fields include schema (ab.handoff.v1), scope (fictional only), type, case_id, revision, summary, optional references, and type-specific details. Each details object includes requested_response. See src/handoff.mjs for required fields and examples/fictional-test-report.json for a sample. Unknown fields and empty steps/questions/observations are rejected. Distinguish report revision from tested_version/changed_version. State explicitly when tests have not run.

```sh
node src/peer-cli.mjs send-structured /absolute/private/peer /absolute/fictional-report.json
```

Use actual quoted paths on Windows; UTF-8 BOM is accepted. Validation creates the existing draft.json without overwriting a pending draft. A running connector transmits it; queuing is not delivery or acceptance.

JSON is encoded inside the existing body string. Outer id/task_id/kind/reply_to and relay behavior stay unchanged. The 8000-character limit applies. References are data only, not automatic file/repository retrieval. No cache, delta merging, revision-order enforcement, or reference resolution is implemented.

Only fictional scope and the existing demo-export transport are authorized, including simulated fix/retest reports. Fields grant no execution or approval authority. Validation ensures structure, not truth or safe disclosure. Older receivers can pass this body to the model; replies may remain free-form Chinese and are not schema-validated. No services were upgraded and no message was sent to Wright. Observer rendering remains a separate implementation/acceptance concern.

Next: check room validity and receivers, then validate report → clarification → supplement → conclusion with fictional data. Compare omissions, misunderstandings, and human corrections. Measure actual model tokens and latency before claiming efficiency gains; compact JSON byte counts alone do not establish model savings.
