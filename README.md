# Vistra DMS (Document Management System)

A full-stack Documents Management System with file upload, folder management, search, and bulk operations.

![Vistra DMS Screenshot](docs/screenshot.png)

## Features

- Folder management with hierarchical navigation
- Document upload with drag & drop (up to 50MB)
- File download and delete
- Search across all documents and folders
- Bulk delete for multiple items
- Responsive UI with Tailwind CSS

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, React Query |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | MySQL 8.0 |
| Validation | Zod |
| File Handling | Multer |

## Project Structure

```
vistra-dms/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── prisma/             # Database schema & migrations
│   │   ├── src/                # Express server, routes, middleware
│   │   └── uploads/            # Uploaded files
│   └── web/                    # Next.js Frontend
│       ├── app/                # App Router pages
│       └── lib/                # API client
├── packages/shared/            # Shared TypeScript types
├── docker-compose.yml          # MySQL database
└── package.json                # Workspace config
```

## Prerequisites

- Node.js 18+
- Docker Desktop
- pnpm (recommended)

## Quick Start

### 1. Install Dependencies

```bash
cd vistra-dms
npm install -g pnpm          # if not installed
pnpm install
```

### 2. Start Database

```bash
docker compose up -d
docker ps  # verify MySQL is running
```

### 3. Setup Database

```bash
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma seed
```

### 4. Run Application

```bash
# Terminal 1: API
cd apps/api && pnpm dev

# Terminal 2: Web
cd apps/web && pnpm dev
```

### 5. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000/documents |
| API | http://localhost:4000 |
| Health | http://localhost:4000/health |

## API Reference

### List Items

`GET /api/items`

| Parameter | Type | Description |
|-----------|------|-------------|
| `parentId` | string | Filter by parent folder UUID |
| `q` | string | Search query |
| `type` | string | Filter by `FOLDER` or `DOCUMENT` |

### Create Folder

`POST /api/items/folders`

```json
{
  "name": "Folder Name",
  "parentId": "uuid (optional)",
  "createdBy": "User Name"
}
```

### Upload File

`POST /api/upload` (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | File to upload |
| `name` | string | No | Custom filename |
| `parentId` | string | No | Parent folder UUID |
| `createdBy` | string | Yes | Creator name |

### Download File

`GET /api/upload/:id/download`

### Delete Item

`DELETE /api/items/:id`

Recursively deletes folders and their contents.

### Bulk Delete

`POST /api/items/delete-bulk`

```json
{ "ids": ["uuid1", "uuid2", ...] }
```

### Error Format

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message"
}
```

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Item not found |
| `DUPLICATE_NAME` | 409 | Name already exists |
| `INTERNAL_ERROR` | 500 | Server error |

## Database Schema

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

## Environment Variables

**Root (.env.example)**
```env
DATABASE_URL="mysql://root:password@localhost:3306/vistra_dms"
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Common Commands

```bash
# Database
cd apps/api && pnpm prisma generate   # Generate client
cd apps/api && pnpm prisma migrate dev # Run migrations
cd apps/api && pnpm prisma seed       # Seed data
cd apps/api && pnpm prisma studio     # Open GUI

# Build
pnpm build:api
pnpm build:web

# Lint
pnpm lint
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Prisma client not generated | `cd apps/api && pnpm prisma generate` |
| MySQL not running | `docker compose up -d` |
| Port in use | `lsof -ti:4000 | xargs kill -9` |
| TypeScript errors | Restart TS server in VS Code |

## License

MIT
