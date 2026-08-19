# SentinelOps Vision

SENTINELOPS — ENTERPRISE SOC/XDR FRONTEND BUILD

Build the complete production-quality frontend for my existing SentinelOps cybersecurity platform.

SentinelOps is an enterprise-style Security Operations Center platform with the tagline:

Monitor. Detect. Investigate. Respond.

The existing backend is Python/FastAPI with PostgreSQL, SQLAlchemy, JWT authentication, RBAC, REST APIs and WebSocket infrastructure.

DO NOT replace or rebuild the Python backend.

Your job is to build the complete modern frontend and connect it to the existing backend.

---

1. TECHNOLOGY

Use:

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- TanStack Query
- Zustand
- Recharts
- React Hook Form
- Zod

Use a clean feature-based architecture.

Do not create unnecessary libraries or dependencies.

Optimize for minimal Lovable credits by reusing components, layouts, hooks and API clients instead of generating duplicate implementations.

---

2. DESIGN

Create a premium enterprise SOC/XDR interface.

Use the supplied SentinelOps screenshot only as a general visual reference.

Do NOT copy it.

Make the new interface significantly more modern, polished and professional.

Visual direction:

- Dark cybersecurity theme
- Near-black background
- Glass/metal panels
- Subtle blue/cyan security accents
- Red for critical threats
- Amber for warnings
- Green for healthy systems
- Smooth but restrained animations
- Professional typography
- High information density
- Excellent spacing
- Responsive desktop/tablet/mobile layouts
- Command-center/SOC feeling

Avoid:

- Generic SaaS dashboard appearance
- Excessive gradients
- Excessive animations
- Cartoonish cybersecurity graphics
- Fake 3D effects
- Huge empty spaces

The interface should look like a serious enterprise security product.

---

3. APPLICATION LAYOUT

Create a persistent authenticated application shell:

SIDEBAR:

- Executive Dashboard
- Alerts
- Incidents
- Cases
- Threat Hunting
- Detection Rules
- IOC Management
- Threat Intelligence
- Asset Management
- Reports
- Notifications
- Admin Portal
- Settings
- Profile

Top bar:

- Global search
- Environment indicator
- WebSocket connection status
- Notifications
- Current user
- Role badge
- Theme/settings controls

Show:

LIVE / CONNECTED

when WebSocket communication is active.

Show a clear degraded/offline indicator when disconnected.

---

4. AUTHENTICATION

Implement a complete authentication experience.

Pages:

- Login
- Forgot Password
- Reset Password
- Account Pending Approval
- Unauthorized / 403
- Session Expired

Authentication must use the existing FastAPI JWT system.

Implement:

- Secure login
- Access token handling
- Refresh token handling
- Automatic token refresh
- Logout
- Session expiration
- Protected routes
- RBAC-aware navigation

Do NOT store sensitive credentials in source code.

The initial administrator account must be bootstrapped securely using environment variables:

ADMIN_EMAIL
ADMIN_PASSWORD

The administrator account is:

ADMIN_EMAIL = vanshvashistha44657@gmail.com

The supplied administrator password must NEVER be displayed in the UI, committed to source code, or exposed through client-side JavaScript.

Hash the password server-side and require secure password handling.

---

5. USER REGISTRATION / APPROVAL

Normal users must NOT automatically receive access to SentinelOps.

Create:

Register → Pending Approval → Administrator Review → Approved/Rejected

Only an Administrator can approve a new user.

Admin can:

- View pending users
- Approve
- Reject
- Assign role
- Disable account
- Reset password
- Revoke sessions

Roles:

- Administrator
- SOC Manager
- SOC Analyst L2
- SOC Analyst L1

The frontend must hide/disable functionality according to RBAC.

Backend authorization remains the ultimate security boundary.

---

6. EXECUTIVE SOC DASHBOARD

Create an exceptional real-time SOC dashboard.

Display:

- Critical Alerts
- High Alerts
- Open Incidents
- Active Cases
- IOC Matches
- Threat Intelligence Matches
- Assets at Risk
- Security Score
- System Health
- Analyst Workload

Charts:

- Alert volume over time
- Severity distribution
- MITRE ATT&CK technique distribution
- Incident timeline
- Threat activity timeline
- Top targeted assets
- Top source IPs
- Alert-to-incident conversion
- False-positive rate

Live panels:

- Live Security Feed
- Recent Alerts
- Recent Incidents
- Recent IOC Matches
- Recent Analyst Activity
- WebSocket Status

Every metric must come from the backend.

Do NOT fabricate dashboard numbers when the API is available.

---

7. ALERT CENTER

Create a professional alert investigation interface.

Features:

- Alert table
- Real-time alert updates
- Search
- Filtering
- Severity filtering
- Status filtering
- MITRE technique filtering
- Source IP
- Destination IP
- Host
- Assigned analyst
- Timestamp

Alert details should display:

- Alert ID
- Detection Rule
- Severity
- Source
- Destination
- Host
- MITRE ATT&CK technique
- Raw event
- Timeline
- Related alerts
- Related incident
- Assigned analyst
- Investigation notes

Actions:

- Assign
- Escalate
- Mark false positive
- Create incident
- Close alert

---

8. INCIDENT MANAGEMENT

Create a professional incident response workspace.

Display:

- Incident queue
- Severity
- Priority
- Status
- Assigned analyst
- Created time
- Updated time
- Affected assets

Incident detail:

- Overview
- Timeline
- Evidence
- Related alerts
- Related cases
- MITRE mapping
- Notes
- Affected assets
- Assignment
- Resolution

Implement proper status workflow visualization.

---

9. CASE MANAGEMENT

Create investigation cases.

Features:

- Case creation
- Case assignment
- Tasks
- Checklist
- Evidence
- Notes
- Timeline
- Related incidents
- Related alerts
- Attachments
- Case status

Make it feel like a real analyst investigation workspace.

---

10. THREAT HUNTING

Create an advanced threat hunting interface.

Search by:

- IP
- Domain
- URL
- Hash
- Hostname
- Username
- Process
- MITRE technique

Features:

- Query builder
- Time range
- Search filters
- Results table
- Result details
- Investigation timeline
- Save hunt
- Previous hunts

Connect directly to the backend Threat Hunting APIs.

---

11. IOC MANAGEMENT

Support:

- IP addresses
- Domains
- URLs
- SHA256
- MD5
- Email addresses
- Processes
- Registry keys

Features:

- IOC search
- Risk score
- Tags
- Source
- First seen
- Last seen
- Related alerts
- Related incidents
- Import
- Export
- IOC detail investigation

---

12. THREAT INTELLIGENCE

Create a professional Threat Intelligence workspace.

Show:

- Malicious IPs
- Malicious domains
- Hashes
- Threat feeds
- Risk scores
- Recent threats
- Intelligence matches
- Sources

Create visual threat cards and intelligence timelines.

External feeds should be optional and controlled by backend configuration.

---

13. ASSET MANAGEMENT

Create an enterprise asset inventory.

Display:

- Servers
- Endpoints
- Users
- Operating systems
- Installed software
- Patch status
- Criticality
- Owner
- Risk
- Last seen

Asset detail should show related alerts/incidents.

---

14. DETECTION RULES

Create a detection engineering interface.

Features:

- Rule list
- Rule status
- Severity
- MITRE technique
- Rule source
- Last triggered
- Enabled/disabled
- Rule details
- Rule testing

Only authorized users can modify detection rules.

---

15. REPORTS

Create a professional reporting center.

Reports:

- Daily SOC Report
- Weekly SOC Report
- Monthly SOC Report
- Incident Report
- SOC Metrics
- Analyst Performance
- False Positives

Actions:

- Generate
- View
- Download
- Export CSV
- Export PDF

Use backend report APIs.

---

16. ADMIN PORTAL

The Admin Portal must ONLY be accessible to Administrator users.

Create sections:

- User Management
- Pending User Approvals
- Roles
- Permissions
- Detection Rules
- Threat Feed Settings
- Notification Settings
- Audit Logs
- System Configuration
- Password Policies
- Sessions

Admin dashboard:

- Total users
- Active users
- Pending approvals
- Failed logins
- Recent admin activity
- Security events
- System health

Audit log viewer:

- User
- Action
- Resource
- Timestamp
- IP address
- Previous value
- New value

---

17. REAL-TIME SYSTEM

Use the existing FastAPI WebSocket infrastructure.

Real-time updates must be used for:

- New alerts
- Critical alerts
- Incident creation
- Incident assignment
- Case updates
- IOC matches
- Notifications
- System health where supported

Implement:

WebSocket → global event manager → TanStack Query/Zustand → UI updates

Do not reload the entire page for live events.

Show:

CONNECTED
RECONNECTING
DISCONNECTED

with automatic reconnection.

If WebSocket temporarily fails, gracefully fall back to API polling where appropriate.

---

18. NOTIFICATIONS

Create a notification center.

Notifications for:

- Critical alert
- Incident assignment
- Case update
- Password change
- IOC creation
- Admin action
- System warning

Support:

- unread/read
- timestamps
- severity
- navigation to related object

---

19. PROFILE & SETTINGS

Profile:

- Name
- Email
- Role
- Last login
- Active sessions

Settings:

- Appearance
- Notifications
- Security
- Session management
- Password change

---

20. API ARCHITECTURE

Before implementing pages:

Inspect the existing FastAPI API contract.

Use the actual:

- REST endpoints
- Request schemas
- Response schemas
- Authentication flow
- RBAC requirements
- WebSocket endpoints

Do NOT invent endpoint names.

Create a centralized typed API client.

Create reusable:

- API hooks
- Query hooks
- Mutation hooks
- WebSocket manager
- Authentication provider
- RBAC utilities

TanStack Query should manage server state.

Zustand should manage appropriate client/global state.

---

21. ERROR / LOADING STATES

Every page must have:

- Loading state
- Skeleton state
- Empty state
- Error state
- Retry action

Handle:

- 401
- 403
- 404
- 422
- 429
- 500
- Network failure
- WebSocket disconnection

Never leave blank screens.

---

22. SECURITY

Follow secure frontend practices.

Never expose:

- JWT secrets
- Database credentials
- Admin password
- Backend secrets

Do not bypass backend RBAC.

Do not rely solely on frontend role checks.

Never put privileged operations behind only a hidden UI button.

---

23. DEMO / REAL DATA REQUIREMENT

The application should show real backend data whenever the backend is running.

Do NOT create fake APIs.

Do NOT hard-code dashboard statistics.

Do NOT create fake alerts pretending they came from the backend.

If the database has no records, show a professional empty state with an explanation and provide authorized controls for generating/ingesting legitimate test data through the backend.

---

24. PERFORMANCE

Optimize the application.

Use:

- Lazy loading where useful
- Pagination
- Virtualized large tables where necessary
- Debounced search
- Cached API queries
- Optimistic updates only where safe
- Reusable components

Do not unnecessarily fetch entire datasets.

---

25. RESPONSIVENESS

Desktop is the primary SOC analyst experience.

Also support:

- Laptop
- Tablet
- Mobile

The dashboard should remain usable on smaller screens.

---

26. FINAL APPLICATION STRUCTURE

The finished application should have:

/login
/dashboard
/alerts
/incidents
/cases
/threat-hunting
/detection-rules
/ioc
/threat-intelligence
/assets
/reports
/notifications
/admin
/settings
/profile

Protected routes must enforce authentication.

Admin routes must enforce Administrator RBAC.

---

27. IMPORTANT IMPLEMENTATION RULE

Do NOT generate everything repeatedly.

Build shared components first:

- AppShell
- Sidebar
- Topbar
- DataTable
- StatusBadge
- SeverityBadge
- MetricCard
- ChartCard
- Timeline
- Modal
- Drawer
- EmptyState
- ErrorState
- LoadingSkeleton
- NotificationCenter

Then reuse them across modules.

This is important to minimize Lovable credit usage and keep the codebase maintainable.

---

28. COMPLETION CRITERIA

The project is considered complete only when:

- Login works
- Authentication works
- RBAC works
- Admin approval works
- Dashboard loads backend data
- Alerts work
- Incidents work
- Cases work
- IOC management works
- Threat Intelligence works
- Threat Hunting works
- Asset Management works
- Detection Rules work
- Reports work
- Notifications work
- WebSockets work
- Admin Portal works
- Settings work
- Profile works
- Loading/error/empty states exist
- No fake APIs
- No placeholder pages
- No dummy buttons
- No hard-coded production credentials
- No broken navigation

Before declaring completion, run the application, test the main user flows, fix runtime/build errors, and verify that all pages load successfully.

Do not claim a feature is complete if it only has a UI without a working backend integration.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://threat-nexus-ui.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ec31a0b9-e88e-4206-bbb5-e58f60e9e043).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
