# Security Tools Guide — MobSF and ScoutSuite

## MobSF (Mobile Security Framework)

### Setup
1. Install Docker.
2. Run MobSF:
```
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
```
3. Access UI at http://localhost:8000

### Analyze your OPSC7311 APK/IPA
1. Build/export your Semester 1 mobile app APK/IPA.
2. Upload it via the MobSF UI.
3. Review findings (static analysis, manifest, permissions, crypto, network).

### Reporting Template (paste into your CR deck)
- Scope: App version/build, platform.
- Summary: Overall risk level; # findings by severity.
- Key Findings:
  - Insecure network communications (HTTP, TLS issues)
  - Weak/hardcoded credentials or API keys
  - Insecure cryptography (ECB, short keys, deprecated hashes)
  - Exported components or excessive permissions
  - Data leakage (logs, backups, screenshots)
- Remediation Plan:
  - Enforce TLS, certificate pinning where applicable
  - Remove secrets from client, move to backend
  - Adopt modern crypto (AES-GCM, PBKDF2/Argon2/Bcrypt)
  - Reduce permissions; secure storage
- Tool Evaluation:
  - Pros: Fast static analysis, actionable categories, easy Docker use
  - Cons: Limited dynamic coverage without emulator integration
  - Verdict: Recommended for static pre-checks; pair with dynamic testing

## ScoutSuite (Cloud Security Auditing)

### Setup
1. Install Python 3 and pip.
2. Install ScoutSuite:
```
pip install scoutsuite
```
3. Configure AWS CLI credentials (IAM user with read-only audit perms).

### Run Against AWS
```
scoutsuite aws --report-dir ./scout-report
```
Output: `./scout-report/scoutsuite-report.html` (open in browser).

### Reporting Template
- Scope: Account/Subscription IDs, regions, date.
- Summary: Risk posture and coverage.
- Key Findings (examples):
  - Public S3 buckets or permissive bucket policies
  - Security groups open to 0.0.0.0/0 on high ports
  - IAM users without MFA, access keys not rotated
  - Unencrypted volumes or snapshots
- Remediation Plan:
  - Enforce bucket policies, block public access
  - Tighten security groups (least privilege)
  - Enforce MFA and key rotation policies
  - Encrypt at rest (EBS, RDS, S3)
- Tool Evaluation:
  - Pros: Broad multi-service view, quick HTML report
  - Cons: Read-only visibility; requires correct IAM perms
  - Verdict: Recommended for environment baselining and periodic audits
