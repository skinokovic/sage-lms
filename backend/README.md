# LMS Backend — Implementation Documentation

A Node.js / Express / MongoDB backend for a Learning Management System, covering
courses, modules, lessons, enrollments, payments, progress tracking, certificates,
and JWT-based authentication.

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | MongoDB (via Mongoose) |
| Auth | JWT (access + refresh tokens) |
| Password hashing | bcryptjs |
| Validation / safety | helmet, express-rate-limit, express-async-handler |

## 2. Project Structure

```
lms-backend/
├── config/
│   └── db.js                 # MongoDB connection
├── models/                   # Mongoose schemas
│   ├── User.js
│   ├── Course.js
│   ├── Module.js
│   ├── Lesson.js
│   ├── Enrollment.js
│   ├── Progress.js
│   ├── Payment.js
│   └── Certificate.js
├── middleware/
│   ├── auth.js                # authenticate + authorize(role)
│   ├── optionalAuth.js        # attaches req.user if token present, never blocks
│   └── errorHandler.js        # notFound + centralized errorHandler
├── controllers/               # business logic
├── routes/                    # Express routers
├── utils/
│   ├── generateTokens.js      # JWT signing helpers
│   └── sendEmail.js           # mock email sender (swap for real provider)
├── server.js                  # app entry point
├── package.json
└── .env.example
```

## 3. Database Schema

### User
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique |
| passwordHash | String | bcrypt hash, `select: false` |
| role | String | `student` \| `admin` |
| resetToken / resetTokenExpiry | String / Date | for password reset, `select: false` |
| refreshTokenHash | String | hashed refresh token, `select: false` |

### Course
`title, slug (unique), description, thumbnailUrl, category, level (beginner/intermediate/advanced), price, instructorId (ref User), published, totalDuration`

### Module
`courseId (ref Course), title, description, order`

### Lesson
`moduleId (ref Module), courseId (ref Course, denormalized), title, videoUrl, duration, order, isPreview, resources[]`

### Enrollment
`userId (ref User), courseId (ref Course), status (active/completed/dropped), enrolledAt, completedAt`
— unique compound index on `(userId, courseId)`

### Progress
`userId, courseId, lessonId, completed, completedAt`
— unique compound index on `(userId, courseId, lessonId)`

### Payment
`userId, courseId, enrollmentId, amount, currency, provider, providerRef, status (pending/succeeded/failed/refunded)`

### Certificate
`userId, courseId, issuedAt, certificateUrl, certificateCode (unique)`
— auto-issued when a user completes every lesson in a course

**Design decisions:**
- Modules and lessons are **separate referenced collections**, not embedded in courses — this keeps documents small and supports independent admin editing and direct lesson lookups.
- Progress is a **separate collection**, not an embedded array on enrollments — this scales better for analytics (e.g. per-lesson completion rates) and keeps the certificate-issuance check (all lessons complete?) a simple count query.

## 4. Authentication Flow

- **Signup** (`POST /api/auth/signup`) — hashes password with bcrypt, creates user, returns access + refresh tokens.
- **Login** (`POST /api/auth/login`) — verifies password, returns access + refresh tokens, stores a hashed refresh token on the user.
- **Refresh** (`POST /api/auth/refresh`) — exchanges a valid refresh token for a new access token.
- **Logout** (`POST /api/auth/logout`) — clears the stored refresh token hash (requires auth).
- **Forgot password** (`POST /api/auth/forgot-password`) — generates a hashed, time-limited reset token; "sends" it via the mock email utility (logs to console; in dev mode the raw token is also returned as `devToken` for easy Postman testing).
- **Reset password** (`POST /api/auth/reset-password`) — verifies the token and expiry, sets a new password hash, invalidates the old refresh token (forces re-login).
- **Access control** — `authenticate` middleware verifies the JWT and loads `req.user`; `authorize('admin')` restricts routes to a given role.

Tokens: short-lived **access token** (default 15m) sent as `Authorization: Bearer <token>`, longer-lived **refresh token** (default 7d) used only to mint new access tokens.

## 5. API Reference

Base URL: `http://localhost:5000/api`

### Auth (`/auth`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register a new user |
| POST | `/login` | Public | Log in |
| POST | `/refresh` | Public | Exchange refresh token for new access token |
| POST | `/logout` | Private | Invalidate refresh token |
| POST | `/forgot-password` | Public | Request password reset |
| POST | `/reset-password` | Public | Reset password with token |
| GET | `/me` | Private | Get current user profile |

### Courses (`/courses`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Admin | Create a course |
| GET | `/` | Public | List courses (published only, unless admin) — supports `?category=&level=&search=&page=&limit=` |
| GET | `/:id` | Public | Get a course with its modules & lessons |
| PUT | `/:id` | Admin | Update a course |
| DELETE | `/:id` | Admin | Delete a course (cascades modules/lessons/enrollments/progress) |

### Modules
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/courses/:courseId/modules` | Admin | Create a module |
| GET | `/courses/:courseId/modules` | Public | List a course's modules |
| PUT | `/modules/:id` | Admin | Update a module |
| DELETE | `/modules/:id` | Admin | Delete a module (cascades lessons) |

### Lessons
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/modules/:moduleId/lessons` | Admin | Create a lesson |
| GET | `/modules/:moduleId/lessons` | Public | List a module's lessons |
| GET | `/lessons/:id` | Public (preview) / Private | Get a single lesson (requires enrollment unless `isPreview`) |
| PUT | `/lessons/:id` | Admin | Update a lesson |
| DELETE | `/lessons/:id` | Admin | Delete a lesson |

### Enrollments (`/enrollments`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Private | Enroll in a course |
| GET | `/me` | Private | Get current user's enrollments |
| GET | `/course/:courseId` | Admin | Get all enrollments for a course |
| PUT | `/:id` | Private (owner or admin) | Update enrollment status |

### Progress (`/progress`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Private | Mark a lesson complete (auto-issues certificate on 100%) |
| GET | `/:courseId` | Private | Get current user's progress in a course |

### Payments (`/payments`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/` | Private | Create a pending payment record |
| POST | `/:id/confirm` | Private* | Confirm payment succeeded, auto-enrolls user |
| GET | `/me` | Private | Get current user's payment history |

\* In production, `/confirm` should be a signed webhook endpoint from your payment provider (Stripe, Paystack, etc.), not user-callable.

### Certificates (`/certificates`)
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/me` | Private | Get current user's certificates |
| GET | `/verify/:code` | Public | Verify a certificate by its public code |

## 6. Setup & Running Locally

```bash
cd lms-backend
npm install
cp .env.example .env      # then fill in real values (JWT secrets, Mongo URI)
npm run dev                # requires nodemon (npm install already includes it as a devDependency)
# or
npm start
```

Requires a running MongoDB instance (local `mongod` or a MongoDB Atlas connection string in `MONGO_URI`).

## 7. Testing with Postman

Import `postman_collection.json` (included alongside this README) into Postman.

1. Run **Auth > Signup** or **Auth > Login** — the collection's test script automatically saves `accessToken` / `refreshToken` / `userId` as collection variables.
2. All subsequent requests use `{{accessToken}}` automatically via the collection's Bearer auth setting.
3. To test admin-only routes, either sign up a user and manually flip their `role` to `admin` in MongoDB, or seed one directly in the database — signup intentionally does not allow self-assigning the admin role.
4. Suggested test order: **Signup/Login → Create Course (admin) → Create Module → Create Lesson → Enroll → Mark Progress → Check Certificate**.
5. Collection variable `baseUrl` defaults to `http://localhost:5000/api` — update it if your server runs elsewhere.

## 8. Notes on Production Hardening (not yet implemented)

These were kept out of scope to match the original task, but are worth flagging:
- Real email provider for password reset (currently mocked/logged to console)
- Real payment provider integration + signed webhooks (Stripe/Paystack/etc.)
- Input validation library (`express-validator` is already installed but not wired into every route)
- File/video upload handling (currently expects a `videoUrl` string, e.g. from S3/Cloudinary)
- Refresh tokens stored as httpOnly cookies instead of returned in the JSON body, for stronger XSS protection
