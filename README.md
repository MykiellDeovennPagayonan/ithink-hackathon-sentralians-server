## 📋 Prerequisites

Before you begin, ensure you have:

| Tool                                | Required Version/Notes                                                      |
| ----------------------------------- | --------------------------------------------------------------------------- |
| **Node.js**                         | v18 or higher (required by Express 5) |
| **npm**                             | Compatible with your Node.js installation                                   |
| **TypeScript**                      | Installed via `npm install --save-dev typescript`                           |
| **ts-node-dev**                     | Installed via `npm install --save-dev ts-node-dev`                          |
| **@types/node**, **@types/express** | For TypeScript type definitions                                             |

You should also be familiar with:

- Basic Node.js and Express fundamentals

---

## 🚀 Step-by-Step Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MykiellDeovennPagayonan/ithink-hackathon-sentralians-server.git
cd ithink-hackathon-sentralians-server
```

### 2. Install Dependencies

```bash
npm install
```

This will install runtime packages (Express, OpenAI, UploadThing, etc.) and development tools like TypeScript and ts-node-dev.

---

### 3. Create Your `.env` File

Create a `.env` file at the project root containing:

```env
UPLOADTHING_TOKEN=your_uploadthing_token
OPENAI_API_KEY=your_openai_api_key
WOLFRAM_APP_ID=your_wolfram_app_id
```

---

### 4. Start Development Server

```bash
npm run dev
```

Server-by-default runs at `http://localhost:8000` (or as configured).

---

### 5. Build & Run for Production

```bash
npm run build
npm start
```

- `build`: compiles TypeScript into `dist/`
- `start`: runs the compiled server with `node dist/server.js`

---

### 6. Linting & Formatting

Keep your codebase clean with:

```bash
npm run lint        # Check for lint issues
npm run lint:fix    # Auto-fix common lint issues
npm run format      # Format code using Prettier
```

---

### ✅ Quick Recap

1. **Clone** the repo
2. **Install** dependencies
3. **Create** `.env` with API keys
4. **Run** dev server: `npm run dev`
5. **Build & start** production server
6. **Maintain code** with lint/format commands
