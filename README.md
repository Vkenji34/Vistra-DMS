# Vistra DMS (Document Management System)

A full-stack Documents Management System built with Next.js, Node.js, TypeScript, and MySQL. Features include file upload/download, folder management, search, and a responsive UI.

![Vistra DMS Screenshot](docs/screenshot.png)

## Features

### Core Functionality
- **Folder Management**: Create, navigate, and delete folders with hierarchical structure
- **Document Management**: Upload, download, and delete documents
- **File Upload**: Drag & drop or click to upload files (up to 50MB)
- **Search**: Real-time search across all documents and folders
- **Bulk Operations**: Select multiple items with checkboxes

### User Interface
- Clean, modern table-based layout
- Responsive design with Tailwind CSS
- Icons for folders and file types
- Loading states and error handling
- Confirmation dialogs for destructive actions

### Backend
- RESTful API with Express.js
- MySQL 8.0 database with Prisma ORM
- Type-safe TypeScript implementation
- Input validation with Zod
- File storage with Multer

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **React Hook Form** - Form handling with validation
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client
- **date-fns** - Date formatting

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe code
- **Prisma ORM** - Database ORM
- **MySQL 8.0** - Relational database
- **Zod** - Schema validation
- **Multer** - File upload handling
- **UUID** - Unique identifier generation

### Development Tools
- **pnpm** - Fast package manager
- **Turbo** - Build orchestration
- **tsx** - TypeScript execution
- **Docker** - Containerized MySQL

## Project Structure

```
vistra-dms/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── migrations/     # Database migrations
│   │   │   └── seed.ts         # Seed data script
│   │   ├── src/
│   │   │   ├── server.ts       # Express server entry
│   │   │   ├── routes/
│   │   │   │   ├── items.ts    # Item CRUD endpoints
│   │   │   │   └── upload.ts   # File upload/download
│   │   │   └── middleware/
│   │   │       └── errorHandler.ts
│   │   └── uploads/            # File storage directory
│   └── web/                    # Next.js Frontend
│       ├── app/
│       │   ├── layout.tsx      # Root layout
│       │   ├── page.tsx        # Home page redirect
│       │   ├── globals.css     # Global styles
│       │   ├── providers.tsx   # React Query provider
│       │   └── documents/
│       │       └── page.tsx    # Documents page
│       ├── lib/
│       │   └── api.ts          # API client functions
│       └── tailwind.config.js
├── packages/
│   └── shared/                 # Shared TypeScript types
│       ├── src/
│       │   └── index.ts        # Type definitions
│       └── tsconfig.json
├── docker-compose.yml          # MySQL container setup
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace configuration
├── turbo.json                  # Turbo build config
└── README.md                   # This file
```

## Prerequisites

- **Node.js** 18.0 or higher
- **Docker Desktop** (for MySQL database)
- **pnpm** (recommended) or npm/yarn

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd vistra-dms

# Install pnpm if needed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Start MySQL Database

```bash
# Start MySQL 8.0 container
docker compose up -d

# Verify MySQL is running
docker ps
# Should show: mysql:8.0 running on port 3306
```

### 3. Setup Database

```bash
# Generate Prisma client types
cd apps/api && pnpm prisma generate

# Run database migrations
cd apps/api && pnpm prisma migrate dev --name init

# Seed with sample data
cd apps/api && pnpm prisma seed
```

### 4. Start Development Servers

**Option A: Separate Terminals**

```bash
# Terminal 1: API Server
cd apps/api && pnpm dev

# Terminal 2: Web Server
cd apps/web && pnpm dev
```

**Option B: Background Processes**

```bash
# Start API in background
cd apps/api && pnpm dev > /tmp/api.log 2>&1 &

# Start Web in background
cd apps/web && pnpm dev > /tmp/web.log 2>&1 &
```

### 5. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000/documents | Main Documents UI |
| API | http://localhost:4000 | REST API base |
| Health | http://localhost:4000/health | API health check |

## API Reference

### List Items

**GET** `/api/items`

Query Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| `parentId` | string | Filter by parent folder UUID |
| `q` | string | Search query for item names |
| `type` | string | Filter by type: `FOLDER` or `DOCUMENT` |

Response:
```json
[
  {
    "id": "uuid",
    "type": "FOLDER",
    "name": "Finance",
    "parentId": null,
    "createdBy": "John Smith",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "fileSizeBytes": null,
    "mimeType": null,
    "extension": null
  }
]
```

### Create Folder

**POST** `/api/items/folders`

Request Body:
```json
{
  "name": "New Folder",
  "parentId": "uuid (optional)",
  "createdBy": "User Name"
}
```

### Upload Document

**POST** `/api/upload`

Content-Type: `multipart/form-data`

Form Fields:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The file to upload |
| `name` | string | No | Custom filename |
| `parentId` | string | No | Parent folder UUID |
| `createdBy` | string | Yes | Creator name |

### Download Document

**GET** `/api/upload/:id/download`

Downloads the file with original filename in Content-Disposition header.

### Delete Item

**DELETE** `/api/items/:id`

- **Folders**: Recursively deletes folder and all contents
- **Documents**: Removes database record and physical file

Response:
```json
{
  "success": true,
  "message": "Folder/Document deleted successfully"
}
```

### Error Responses

All endpoints return consistent error format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": { /* optional validation details */ }
}
```

Common Error Codes:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Item not found |
| `DUPLICATE_NAME` | 409 | Name already exists in location |
| `INVALID_PARENT` | 400 | Parent must be a folder |
| `INTERNAL_ERROR` | 500 | Server error |

## Database Schema

### Item Table

```prisma
model Item {
  id            String   @id @default(uuid())
  type          ItemType
  name          String
  parentId      String?
  parent        Item?    @relation("ItemHierarchy", fields: [parentId], references: [id])
  children      Item[]   @relation("ItemHierarchy")
  createdBy     String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  fileSizeBytes BigInt?
  mimeType      String?
  extension     String?

  @@index([parentId, type, name])
  @@index([name])
}

enum ItemType {
  FOLDER
  DOCUMENT
}
```

### Relationships
- Self-referencing `parentId` for folder hierarchy
- Folders can contain both folders and documents
- Document-specific fields are nullable for folders

## File Storage

### Storage Location
Uploaded files are stored in: `apps/api/uploads/`

### File Records
A `.file_records` JSON file maps document IDs to physical files:
```json
{
  "doc-uuid-1": {
    "originalName": "report.pdf",
    "storedName": "abc123.pdf",
    "path": "/path/to/uploads/abc123.pdf"
  }
}
```

### File Limits
- Maximum file size: 50MB
- Supported types: Any (no restrictions)

## Environment Variables

### Root Configuration (.env.example)
```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/vistra_dms"

# API Server
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Development

### Building for Production

```bash
# Build API
pnpm build:api

# Build Web
pnpm build:web
```

### Linting

```bash
# Run linter
pnpm lint
```

### Database Operations

```bash
# Generate Prisma client
cd apps/api && pnpm prisma generate

# Create new migration
cd apps/api && pnpm prisma migrate dev --name describe_change

# Apply migrations
cd apps/api && pnpm prisma migrate deploy

# Seed database
cd apps/api && pnpm prisma seed

# Open Prisma Studio (GUI)
cd apps/api && pnpm prisma studio
```

## Troubleshooting

### Prisma Client Not Generated
```bash
cd apps/api && pnpm prisma generate
```

### MySQL Connection Refused
Ensure Docker container is running:
```bash
docker ps
# If not running:
docker compose up -d
```

### Module Not Found: 'shared'
Build the shared package:
```bash
cd packages/shared && pnpm build
```

### Port Already in Use
Kill existing processes:
```bash
lsof -ti:4000 | xargs kill -9  # API
lsof -ti:3000 | xargs kill -9  # Web
```

### TypeScript Errors
Restart TypeScript server:
- VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

## License

MIT License - see LICENSE file for details.

## Author

Built for Vistra GEP Coding Assignment.
