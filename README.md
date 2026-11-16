# MCHA-WEBSITE

CSC 190 - Team Code Blooded - M.CHA Website

Website for M.CHA: product browsing and checkout for customers, pop-up events, and admin/staff tools.

- **Jira board:** https://codeblooded.atlassian.net/jira/software/projects/SCRUM/boards/1
- **Integration branch:** `develop` (all feature work merges here first)

## Tech stack

| Part | Tech |
|---|---|
| Frontend | React 19 + Vite (`frontend/`) |
| Backend | Node.js + Express 5 (`backend/`) |
| Database | MySQL 8+ (via `mysql2`) |
| Auth | `bcrypt` for password hashing, `jsonwebtoken` for login tokens |
| Payments | Square (not Stripe) |
| Hosting | Render (suggested) |

## Project structure

```
MCHA-WEBSITE/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── routes/            # One file per feature (e.g. health.js, auth.js)
│   ├── controllers/       # Request handlers used by routes
│   ├── middleware/        # Auth checks, role guards, etc.
│   ├── db/
│   │   ├── pool.js        # MySQL connection pool (reads DATABASE_URL)
│   │   └── schema.sql     # Database tables
│   └── .env.example       # Template for your local backend/.env
└── frontend/
    ├── index.html
    ├── vite.config.js     # Dev server on :5173, proxies /api to :3000
    └── src/
        ├── main.jsx
        ├── App.jsx        # Page routes
        ├── pages/         # One component per page
        ├── components/    # Shared components
        └── api/           # Functions that call the backend (one file per feature)
```

## Prerequisites

- **Node.js 22 LTS** (or 20.19+). Vite 8 will not run on Node 18. Check with `node --version`.
- **MySQL 8 or newer** running locally ([download](https://dev.mysql.com/downloads/mysql/), or `brew install mysql`), or a hosted MySQL database URL.
- **Git**

## Local setup

### 1. Clone the repo and switch to `develop`

```bash
git clone https://github.com/Rah05/MCHA-WEBSITE.git
cd MCHA-WEBSITE
git checkout develop
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and fill in your values:

| Variable | What it is |
|---|---|
| `PORT` | Port for the API. Leave as `3000` (the frontend proxy expects it). |
| `DATABASE_URL` | Your MySQL connection string, e.g. `mysql://root:yourpassword@localhost:3306/mcha` |
| `DATABASE_SSL` | `false` for a local database, `true` for most hosted databases |
| `JWT_SECRET` | Any long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

**Never commit `.env`.** It's ignored by git; only `.env.example` belongs in the repo. If you add a new variable, add it to `.env.example` with a placeholder value.

Create the database and tables (reads `DATABASE_URL` from `.env`, safe to re-run):

```bash
npm run db:setup
```

Optional: load 7 sample products (from the admin Figma mockup) so the shop and admin pages have data:

```bash
npm run db:seed
```

Start the API:

```bash
npm run dev      # restarts automatically when you save (nodemon)
# or
npm start
```

Check it works: open http://localhost:3000/api/health. You should see `"status": "ok"` and `"database": "connected"`.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Requests to `/api/...` are forwarded to the backend on port 3000, so keep both running.

### Useful scripts

| Where | Command | What it does |
|---|---|---|
| `backend/` | `npm run dev` | Start the API with auto-restart |
| `backend/` | `npm start` | Start the API |
| `backend/` | `npm run db:setup` | Create the database and apply `db/schema.sql` |
| `backend/` | `npm run db:seed` | Same as `db:setup`, plus sample products from `db/seed.sql` |
| `backend/` | `npm test` | Run the backend tests (needs the database set up) |
| `frontend/` | `npm run dev` | Start the dev server |
| `frontend/` | `npm run build` | Production build into `frontend/dist/` |
| `frontend/` | `npm run lint` | Lint with oxlint |

## Running the tests

The backend tests use Node's built-in test runner, so there's nothing extra to install. Most of them need MySQL running and the database set up:

```bash
cd backend
npm run db:setup   # first time, and again after pulling database changes
npm test
```

A passing run ends with `# fail 0`. To run a single file: `node --test tests/login.test.js`.

| File | What it checks | Ticket |
|---|---|---|
| `tests/login.test.js` | Valid and invalid sign-in: right password, wrong password, unknown email (same reply), missing fields | SCRUM-98 |
| `tests/auth.test.js` | Role restrictions: guests get 401, the wrong role gets 403, tampered or expired tokens are rejected, role changes apply immediately | SCRUM-55 |
| `tests/passwordReset.test.js` | Forgot/reset password: expired, reused, and made-up links are rejected; short passwords; a reset signs the user out on every device | SCRUM-100, SCRUM-101 |
| `tests/password.test.js` | Password hashing with bcrypt (no database needed) | SCRUM-54 |
| `tests/https.test.js` | HTTPS redirect and security headers (no database needed) | SCRUM-53, SCRUM-56 |
| `tests/orders.test.js` | Order history API | SCRUM-82, SCRUM-83 |
| `tests/schema.test.js` | Database rules for products and orders | SCRUM-120 |

Good to know:

- The tests use the database in `backend/.env`. Each file creates its own test users (emails ending in `example.com`) and deletes them afterwards, so your own data is left alone. **Never run the tests against the production database.**
- No email is sent. The reset tests read the link from the console, the same way you would locally.
- If `JWT_SECRET` isn't set, the tests use a throwaway one.
- If login tests fail with a 500 error after a pull, run `npm run db:setup`. A new column was probably added.

## Git workflow

1. **Start from the latest `develop`:**
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/scrum-<number>-short-description
   ```
2. **Commit with the Jira key** so commits show up on the ticket:
   ```bash
   git commit -m "SCRUM-81 add customer sign-in form"
   ```
3. **Push and open a pull request into `develop`** (not `main`). Fill in the PR template.
4. **Get at least one teammate to review** before merging.
5. `develop` is merged into `main` when the team is ready to release.

Before opening a PR, pull the latest `develop` into your branch and fix any conflicts (`App.jsx` and `server.js` are shared by most features):

```bash
git checkout develop && git pull
git checkout your-branch
git merge develop
```

## Adding a feature

- **New API endpoint:** add `backend/routes/<feature>.js` (and a controller if it has logic), then register it in `server.js`: `app.use('/api/<feature>', require('./routes/<feature>'));`
- **New page:** add `frontend/src/pages/<Page>.jsx` and its route in `App.jsx`.
- **Calling the API from React:** add a helper in `frontend/src/api/<feature>.js`, like `api/health.js`.
- **New database table:** add it to `backend/db/schema.sql` using `CREATE TABLE IF NOT EXISTS` so the file can be re-run safely.

## Roles and permissions

There are four kinds of visitor: **guest** (not signed in), **customer**, **staff**, and **admin**. Roles live in the `roles` table, and each user has one.

### Protecting a backend route

Use the middleware in `backend/middleware/auth.js`:

```js
const { ROLES, requireAuth, optionalAuth, requireRole, requireSelfOrRole } = require('../middleware/auth');

router.get('/products', listProducts);                                                   // anyone, including guests
router.get('/menu', optionalAuth, showMenu);                                             // anyone; req.user is set if signed in
router.get('/account', requireAuth, showAccount);                                        // any signed-in user
router.post('/products', requireAuth, requireRole(ROLES.ADMIN), createProduct);         // admins only
router.get('/schedules', requireAuth, requireRole(ROLES.ADMIN, ROLES.STAFF), listShifts); // admins and staff
router.get('/users/:userId/orders', requireAuth, requireSelfOrRole('userId', ROLES.ADMIN), listOrders); // own orders, or admin
```

- `requireAuth` returns **401** if there's no valid login. Inside the route, `req.user` is `{ id, email, first_name, last_name, role }`.
- `requireRole(...)` returns **403** if the user's role isn't in the list. Always put `requireAuth` before it.
- The role is read from the database on every request, so changing someone's role (or deleting them) takes effect immediately.
- **Hiding a button in the frontend is not security.** Every admin/staff API route must use `requireRole`, because anyone can call the API directly.

### Signing in (for the login endpoint, SCRUM-98)

After checking the password with `bcrypt.compare`, create a token and send it back:

```js
const { signToken } = require('../middleware/auth');
res.json({ token: signToken(user) });
```

The frontend sends it on every request as a header: `Authorization: Bearer <token>`. Logins last `JWT_EXPIRES_IN` (default `2h`).

### Showing the right pages in the frontend

`GET /api/users/me` (with the token) returns the signed-in user and their `role`. Pass that role to `RoleGuard` to show or hide pages and buttons.

### Who can do what (proposal, confirm with the team)

| | Guest | Customer | Staff | Admin |
|---|:-:|:-:|:-:|:-:|
| Browse products, menu, events | ✅ | ✅ | ✅ | ✅ |
| Register / sign in | ✅ | – | – | – |
| Own account, order history, book events | | ✅ | ✅ | ✅ |
| Staff schedules (view own) | | | ✅ | ✅ |
| Manage events, view event requests | | | ✅ | ✅ |
| Manage products, prices, wholesale | | | | ✅ |
| Create/edit staff schedules, manage users and roles | | | | ✅ |

## Database tables

Defined in `backend/db/schema.sql`:

| Table | What it holds |
|---|---|
| `roles` | `admin`, `staff`, `customer` |
| `users` | Accounts: email, bcrypt password hash, role, name, password-reset token |
| `products` | Name, category, `price`, `wholesale_price` (NULL = not sold wholesale), `stock`, `stock_label` (e.g. "Made to order"), `is_available` |
| `orders` | One per checkout: customer (or NULL `user_id` for guests), `order_type` (retail/wholesale), `status` (pending → paid → fulfilled, or cancelled/refunded), totals, `square_payment_id` |
| `order_items` | Products in each order, with the name and price **copied at checkout** so old orders stay correct after price changes |

Rules the database enforces:

- Prices and stock can't be negative, and order quantities must be at least 1.
- A product that has been ordered **can't be deleted**. Set `is_available = FALSE` to hide it instead.
- Deleting an order deletes its items. Deleting a user keeps their orders (they become guest orders).
- **Never send `wholesale_price` to customers.** Only include it in admin/wholesale API responses.
- Prices are dollars (`DECIMAL`) and come back as numbers. Square expects cents, so convert with `Math.round(price * 100)` when creating a payment.

## Order history API (SCRUM-82, SCRUM-83)

Both routes need a signed-in user (`Authorization: Bearer <token>`).

| Route | Who | Returns |
|---|---|---|
| `GET /api/orders` | Signed-in user | Their own orders, newest first: `{ orders: [{ orderNumber, createdAt, status, orderType, total, itemCount }] }`. An empty array means no orders yet (show an empty state). |
| `GET /api/orders/:orderId` | The order's customer, or admin/staff | `{ order: { ...same fields, subtotal, customerName, customerEmail, notes, items: [{ name, unitPrice, quantity, lineTotal }] } }` |

- A customer asking for someone else's order gets **404 "Order not found"** (not 403), so order numbers can't be guessed.
- Item names and prices are the ones saved at checkout, so they don't change if a product is edited later.
- `status` is one of `pending`, `paid`, `fulfilled`, `cancelled`, `refunded`.

## Admin products API (SCRUM-63 to SCRUM-66)

Every route is **admin only** (401 if signed out, 403 for staff and customers). Send JSON with `Content-Type: application/json`.

| Route | What it does | Returns |
|---|---|---|
| `GET /api/admin/products` | All products, including hidden ones and wholesale prices | `{ products: [...] }` |
| `GET /api/admin/products/:id` | One product, to fill in the edit form | `{ product }` |
| `POST /api/admin/products` | Add a product (SCRUM-63) | **201** `{ product }` |
| `PATCH /api/admin/products/:id` | Edit a product; only the fields you send change (SCRUM-64) | `{ product }` |
| `PATCH /api/admin/products/:id/price-availability` | Change price, stock, or availability only (SCRUM-66) | `{ product }` |
| `DELETE /api/admin/products/:id` | Delete, or hide it if it has been ordered (SCRUM-65) | `{ id, action }` |

Product fields (same names in requests and responses):

| Field | Type | Notes |
|---|---|---|
| `name` | text, up to 150 | **Required** when adding. Must be unique (409 if taken). |
| `category` | text, up to 50 | **Required** when adding, e.g. `Matcha`, `Roasted tea`, `Teaware`, `Drinks (pop-up)` |
| `price` | number | **Required** when adding. Dollars, at most 2 decimals. Send a number, not a string (`Number(input.value)`). |
| `wholesalePrice` | number or `null` | `null` means not sold wholesale |
| `description` | text or `null` | |
| `stock` | whole number | Defaults to 0 |
| `stockLabel` | text or `null` | Shown instead of a count, e.g. `Made to order` |
| `imageUrl` | `http(s)` link or `null` | Image upload isn't built yet, so use a link for now |
| `isAvailable` | `true` / `false` | Defaults to `true`. `false` hides it from the shop |

Responses also include `id`, `createdAt`, and `updatedAt`. Invalid input returns **400** with an `error` message you can show next to the form, and unknown fields (e.g. `retail`) are rejected rather than ignored.

## Querying MySQL

Import the shared pool with `const pool = require('../db/pool');`. If you're used to Postgres (`pg`), three things are different:

| | Postgres (`pg`) | MySQL (`mysql2`) |
|---|---|---|
| Placeholders | `$1, $2` | `?, ?` |
| Result | `const result = await pool.query(...)` then `result.rows` | `const [rows] = await pool.query(...)` |
| New row's id | `INSERT ... RETURNING id` | `const [result] = await pool.query('INSERT ...')` then `result.insertId` |

```js
// Select
const [users] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);
if (users.length === 0) { /* not found */ }

// Insert, then read back the new row
const [result] = await pool.query(
  'INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)',
  [email, passwordHash, roleId]
);
const [[user]] = await pool.query('SELECT id, email, created_at FROM users WHERE id = ?', [result.insertId]);
```

Always pass values as the second argument (`[...]`), never by building the SQL string yourself. That keeps queries safe from SQL injection.

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| `ECONNREFUSED ...:3306` | MySQL isn't running. Windows: open Services (Win+R, `services.msc`) and start **MySQL80**. Mac: `brew services start mysql`. |
| `ER_ACCESS_DENIED_ERROR` | The username or password in `DATABASE_URL` is wrong. Test it with `mysql -u root -p`, URL-encode special characters (`@` becomes `%40`), and make sure no Windows environment variable named `DATABASE_URL` overrides `backend/.env`. |
| `Cannot find module 'xyz'` | A teammate added a package. Run `npm install` in `backend/` and `frontend/`, then restart. |
| `ENOENT ... package.json` | You're in the wrong folder. Run `npm` commands from `backend/` or `frontend/`, not the project root. |
| `mysql: command not found` | Use the full path to `mysql.exe` (for example `C:\Program Files\MySQL\MySQL Server 8.0\bin\`), or add that folder to your PATH. |
| Frontend shows "API status: unreachable" | The backend isn't running. Start it in its own terminal and refresh. |
| `EADDRINUSE ... :3000` | Another process is using port 3000. Close the old backend terminal. |

## After pulling new code

Run `npm install` in `backend/` and `frontend/` after every `git pull` or merge of `develop`, then restart both servers. If the pull changed `backend/db/schema.sql`, also run `npm run db:setup` in `backend/`. It adds new tables and columns without deleting your data.

## Windows notes

- Use Git Bash so commands like `cp` work.
- Clone into a folder outside OneDrive (for example `~/dev`). OneDrive slows `npm install` and can lock files.
- Install MySQL with the MySQL Installer for Windows, and remember the root password you set.
