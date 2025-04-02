Filecoin Hackathon App Spec Document - fileseek

1. Overview
The app is designed to enhance discoverability and usability of files stored on Filecoin. Currently, Filecoin stores only a hash for file names and minimal metadata, which forces users to access each file individually to understand its contents. Our solution allows users to add meaningful tags and metadata, search for files based on these tags, and interact with files through upvotes, downvotes, and comments. The application leverages Supabase for data storage and Next.js for both frontend and API backend services.

2. Problem Statement
Current Challenge:
File data on Filecoin is stored as hashes with minimal metadata. Users cannot tell what the file contains or even determine the file extension without accessing the file.

Our Solution:
Provide a user-friendly interface that enables:

Tagging files with descriptive metadata.

Searching and filtering files based on file type, tags, upload date, and community upvotes.

Viewing file details with an option to see a custom thumbnail (if provided) or a default based on file type.

Engaging with content through votes, comments, and reports.

3. Tech Stack
Frontend:
Framework: Next.js
UI Library: Shadcn (component library)
Styling: Tailwind CSS

Backend:
API: Next.js API routes
Database & Auth: Supabase

Authentication:
Wallet authentication using MetaMask.

After successful authentication, user data is stored in Supabase to track user interactions (tagging, voting, commenting, and reporting).

4. Application Architecture

4.1 Dashboard (Public)
Layout:
A card-based grid where each card represents a file stored on Filecoin.

Displayed Information:
File type and size.
Tags associated with the file.
Thumbnail (user-uploaded or default based on file type).
Vote counts (upvotes/downvotes).

Functionality:
Search and filter files based on:
File type.
Tags.
Upload date.
Number of upvotes.

Voting system where users can upvote or downvote files.

4.2 File Detail Page
Details Displayed:
All the information shown on the dashboard.
Additional details such as a description provided by the tagger.
Comments section displaying existing comments.
Report button for users to flag files.

4.3 Tagging & User Interactions
Tagging New Files:

Accessible via a header button.
Opens a modal with a form requesting:
Required: Network, file path, file size, file type.
Optional: Thumbnail, description.

User Actions (Require Authentication):
Tagging new files.
Voting (upvote/downvote).
Commenting on files.
Reporting files.

Authentication Flow:
Authentication via MetaMask.

After authentication, user data is stored in Supabase to map interactions to the corresponding user.

4.4 Reward System
Incentives:
Users are rewarded with points for tagging files.

Configuration:
Reward points (e.g., 10 points per tagged file) are configurable and stored as a constant in a dedicated configuration file.

User Reward Tracking:
Reward points are recorded in the user profile in Supabase.

5. Database Schema (Supabase)

---

Users Table

id: UUID
Primary key; auto-generated.

wallet_address: Text
Unique identifier for the user’s MetaMask wallet; required.

reward_points: Integer
Stores the accumulated reward points for the user; defaults to 0.

created_at: Timestamp
Records the creation time of the user record; defaults to the current time.

---

Files Table

id: UUID
Primary key; auto-generated.

filecoin_hash: Text
Unique hash of the file stored on Filecoin; required.

file_name: Text
Optional name of the file.

file_type: Text
Type of the file (e.g., image, document); required.

file_size: BigInt
Size of the file in bytes; required.

thumbnail_url: Text
URL of the thumbnail image; optional.

description: Text
Optional description provided by the tagger.

network: Text
Network identifier where the file is stored; required.

upload_date: Timestamp
Date and time when the file record was created; defaults to the current time.

---

Tags Table

id: UUID
Primary key; auto-generated.

tag: Text
Unique tag text; required.

---

File Tags (Mapping Table)

file_id: UUID
References the Files table; cascade delete enabled.

tag_id: UUID
References the Tags table; cascade delete enabled.

Composite Primary Key: Combination of file_id and tag_id ensures each tag is associated uniquely with a file.

---

Votes Table

id: UUID
Primary key; auto-generated.

file_id: UUID
References the Files table; cascade delete enabled.

user_id: UUID
References the Users table; cascade delete enabled.

vote_type: SmallInt
Indicates the type of vote (1 for an upvote, -1 for a downvote); required.

created_at: Timestamp
Records when the vote was made; defaults to the current time.

---

Comments Table

id: UUID
Primary key; auto-generated.

file_id: UUID
References the Files table; cascade delete enabled.

user_id: UUID
References the Users table; cascade delete enabled.

comment: Text
The content of the comment; required.

created_at: Timestamp
Records the time the comment was created; defaults to the current time.

---

Reports Table

id: UUID
Primary key; auto-generated.

file_id: UUID
References the Files table; cascade delete enabled.

user_id: UUID
References the Users table; cascade delete enabled.

report_reason: Text
Optional reason for reporting the file.

created_at: Timestamp
Records when the report was made; defaults to the current time.

---

6. API Endpoints (Next.js API Routes)
File Operations:

GET /api/files – Retrieve list of files with filtering options.

GET /api/files/[id] – Retrieve detailed information of a specific file.

POST /api/files – Tag a new file (authentication required).

User Operations:

GET /api/users/[id] – Retrieve user profile details including reward points.

Voting & Comments:

POST /api/files/[id]/vote – Submit an upvote or downvote (authentication required).

POST /api/files/[id]/comment – Add a comment to a file (authentication required).

POST /api/files/[id]/report – Report a file (authentication required).

7. Configuration Files
Reward Points Configuration:
Create a separate configuration file (e.g., reward-config.js) to store the reward points constant.

8. UI/UX Design Guidelines
Design Principle:

Minimal and professional interface.

Color Theme:

Align closely with Filecoin’s branding and color palette.

Responsiveness:

Ensure the interface is fully responsive and accessible on various devices.

User Experience:

Smooth transitions and modals.

Clear visual cues for interactive elements such as voting buttons, search filters, and report actions.

Consistent card layout for the dashboard.

9. Code Guidelines
Commenting:

Add meaningful comments throughout the code to clarify functionality and decision-making.

Readability:

Maintain a clean code structure with clear separation of concerns (frontend, API routes, database logic).

Security:

Implement secure authentication practices.

Validate and sanitize user inputs to protect against common vulnerabilities.

10. Summary
This document provides a detailed specification for the Filecoin Hackathon app. The app focuses on improving the accessibility of files stored on Filecoin by enabling tagging, searching, and user interactions. The frontend is built with Next.js, Shadcn UI components, and Tailwind CSS, while the backend uses Next.js API routes with Supabase for data storage and authentication. The comprehensive database schema is designed to support all functionalities including file metadata, tagging, voting, comments, reports, and user rewards. The modular architecture and clear configuration guidelines ensure that the app is scalable, secure, and aligned with Filecoin's brand identity.

