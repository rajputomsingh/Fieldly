# Security Policy

[![Security](https://img.shields.io/badge/Security-Active-brightgreen)](./SECURITY.md)
[![Supported](https://img.shields.io/badge/Version-Latest-blue)](https://github.com/rajputomsingh/Fieldly)
[![Dependabot](https://img.shields.io/badge/Dependabot-Enabled-0366d6?logo=dependabot)](https://github.com/rajputomsingh/Fieldly/security/dependabot)
[![CodeQL](https://img.shields.io/badge/CodeQL-Scanning-1f6feb?logo=github)](https://github.com/rajputomsingh/Fieldly/security/code-scanning)
[![Responsible Disclosure](https://img.shields.io/badge/Disclosure-Coordinated-purple)](./SECURITY.md)

Fieldly takes security seriously. If you discover a security vulnerability,
please report it responsibly and privately.

> **Do not open public GitHub issues for security vulnerabilities.**

## Supported Versions

Fieldly is currently under active development.

| Version | Supported |
|---|---|
| Latest | ✅ |

Only the latest version receives security updates. During active development,
we recommend keeping deployments up to date with the latest available release.

## Private Vulnerability Reporting

Please report security vulnerabilities through one of the following channels:

- **GitHub Security Advisories**  
  https://github.com/rajputomsingh/Fieldly/security/advisories/new

- **Security Email**  
  `omchouhan227@gmail.com`

Please do not disclose sensitive vulnerability details publicly before the
issue has been assessed and, where appropriate, remediated.

## What to Include

When submitting a report, please include:

- Vulnerability description
- Steps to reproduce
- Affected routes, APIs, or components
- Potential impact
- Suggested remediation, if available
- Contact information for follow-up

Detailed reproduction steps and relevant technical context help with
validation and remediation.

## Response Timeline

| Stage | Timeline |
|---|---|
| Initial acknowledgment | Within 72 hours |
| Validation & assessment | Within 5 business days |
| Patch development | Based on severity |
| Public disclosure | Coordinated with reporter |

These timelines are targets and may vary depending on the complexity and
severity of the reported issue.

## Severity Classification

| Severity | Examples | Response |
|---|---|---|
| Critical | Authentication bypass, remote code execution, major data exposure | Immediate |
| High | Privilege escalation, injection vulnerabilities | Prioritized within 48 hours |
| Medium | Information disclosure, CSRF, security misconfiguration | Addressed in the next scheduled release |
| Low | Minor issues, best-practice violations | Tracked and reviewed |

Severity is determined based on the actual impact, exploitability, affected
resources, and available evidence.

## In Scope

The following areas are considered in scope for security reporting:

- Authentication and authorization flows
- API routes and Server Actions
- Database access and query patterns
- Realtime infrastructure and WebSocket communication
- File uploads and storage handling
- Environment variable management
- Dependency vulnerabilities
- Access control and role-based permissions
- Input validation and sanitization

## Out of Scope

The following are generally considered out of scope:

- Social engineering attacks
- Denial-of-service attacks
- Spam or rate-limit abuse
- Vulnerabilities in third-party providers
- Issues requiring physical access to a device
- Self-XSS without privilege escalation
- Theoretical vulnerabilities without a proof of concept

Issues involving third-party infrastructure may still be documented where they
affect Fieldly's integration or security boundary.

## Coordinated Disclosure

Fieldly follows a coordinated disclosure process:

1. Vulnerability is reported privately.
2. The issue is validated and reproduced.
3. A fix is developed and tested.
4. A security patch is released.
5. Public disclosure is coordinated with the reporter.

Researchers may be credited for responsible disclosure with permission.

## Security Best Practices

Contributors and maintainers should follow these practices:

- Never commit secrets, credentials, or API keys.
- Use `.env.example` for environment templates.
- Rotate compromised secrets immediately.
- Keep dependencies updated regularly.
- Validate and sanitize user input server-side.
- Apply least-privilege access principles.
- Review code for OWASP Top 10 vulnerabilities.
- Use secure authentication and authorization flows.
- Avoid exposing sensitive data in logs or error messages.

## Dependency & Infrastructure Security

Fieldly uses multiple layers of security tooling and practices, including:

- GitHub Dependabot Alerts
- Secret Scanning
- CodeQL Code Scanning
- Automated dependency monitoring
- Environment variable isolation
- Server-side validation

## Recognition

Responsible disclosures may be acknowledged in:

- Release notes
- Security advisories
- Contributor recognition sections
- Future Hall of Fame acknowledgments

Recognition is subject to the researcher's permission and disclosure
preferences.

## Contact

- **Security Email:** `omchouhan227@gmail.com`
- **Maintainer:** [@rajputomsingh](https://github.com/rajputomsingh)
- **GitHub Security Advisories:**  
  https://github.com/rajputomsingh/Fieldly/security/advisories/new

---

*Last updated: September 2026*
