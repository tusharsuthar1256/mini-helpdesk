# Mini Helpdesk

Live link: to be added

A support ticket system. Users can create tickets and admins can manage and resolve them.

## Features

- Register and login with JWT
- Two roles: user and admin
- Users can create tickets and see their own tickets
- Users can edit or delete a ticket while it is open
- Admins can see all tickets and change status, priority and assignee
- Comments on tickets
- Activity log, notifications and emails using events
- Search, filter, sort and pagination
- Dashboard with ticket counts
- Admins can change user roles

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, BoardUI components
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT and bcrypt

## How to run

You need Node.js 20 or above and a MongoDB database.

1. Install packages

```bash
npm run install:all
```

2. Create the `.env` file and add your `MONGO_URI` and `JWT_SECRET`

```bash
cp server/.env.example server/.env
```

3. Start the server and the client in two terminals

```bash
npm run dev:server
npm run dev:client
```

Server runs on http://localhost:5000 and client runs on http://localhost:5173

To make the first admin, register a user and change its `role` to `admin` in the `users` collection of MongoDB. After that, an admin can change roles from the Users page.

## Docker

```bash
docker compose up --build
```

The app will run on http://localhost:5000

## Deployment

`render.yaml` is included for Render. Set `MONGO_URI` and `CLIENT_URL` there.

## Folder structure

```
server/
  src/
    config/        database connection
    controllers/   request handlers
    events/        event bus and listeners
    middleware/    auth middleware
    models/        mongoose models
    routes/        api routes
    utils/         helper functions
client/
  src/
    api/           axios setup
    components/    Layout, TicketForm, TicketManage and BoardUI components
    context/       auth context
    pages/         all pages
    styles/        BoardUI theme
    utils/         helper functions
```

## API

Base URL: `http://localhost:5000/api`

Send the token in the header for every API except register, login and health:

```
Authorization: Bearer <token>
```

Success response:

```json
{ "success": true, "data": {} }
```

Error response (`details` is sent only for register and ticket validation errors):

```json
{ "success": false, "message": "Validation failed", "details": [{ "field": "title", "message": "Title must be between 5 and 120 characters" }] }
```

List APIs with pages also return `pagination` with `page`, `limit`, `total` and `totalPages`.

### Auth

| Method | URL | Access | What it does |
|---|---|---|---|
| POST | `/auth/register` | Public | Creates a user account and returns the user and token |
| POST | `/auth/login` | Public | Checks email and password and returns the user and token |
| GET | `/auth/me` | Logged in | Returns the current user |

Register body:

```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "Passw0rd" }
```

Password must be 8 to 72 characters with a letter and a number. Every new account gets the `user` role.

### Tickets

| Method | URL | Access | What it does |
|---|---|---|---|
| GET | `/tickets` | User, Admin | User gets own tickets, admin gets all tickets |
| POST | `/tickets` | User, Admin | Creates a ticket with status `open` |
| GET | `/tickets/stats` | User, Admin | Returns ticket counts for the dashboard |
| GET | `/tickets/:id` | Owner, Admin | Returns one ticket |
| PATCH | `/tickets/:id` | Owner (only open), Admin | Updates title, description, category or priority |
| DELETE | `/tickets/:id` | Owner (only open), Admin | Deletes the ticket with its comments and notifications |
| PATCH | `/tickets/:id/manage` | Admin | Changes status, priority or assignee |
| GET | `/tickets/:id/activity` | Owner, Admin | Returns the activity of the ticket |

Create ticket body:

```json
{ "title": "VPN not working", "description": "VPN disconnects every 10 minutes.", "category": "technical", "priority": "high" }
```

Manage ticket body (all fields are optional, but send at least one):

```json
{ "status": "resolved", "priority": "urgent", "assignedTo": "adminId or null" }
```

Query params for `GET /tickets`:

| Param | Example | Notes |
|---|---|---|
| `page`, `limit` | `page=1&limit=10` | limit can be up to 100 |
| `status` | `status=open` | open, in_progress, resolved, closed |
| `priority` | `priority=high` | low, medium, high, urgent |
| `category` | `category=billing` | technical, billing, account, feature_request, general |
| `search` | `search=vpn` | searches title and description, or a number like `TCK-1001` |
| `sortBy` | `sortBy=priority` | createdAt, updatedAt, title, priority, status |
| `order` | `order=asc` | asc or desc |

### Comments

| Method | URL | Access | What it does |
|---|---|---|---|
| GET | `/tickets/:id/comments` | Owner, Admin | Returns all comments of the ticket |
| POST | `/tickets/:id/comments` | Owner, Admin | Adds a comment, not allowed on a closed ticket |

Comment body:

```json
{ "body": "Any update on this?" }
```

### Notifications

| Method | URL | Access | What it does |
|---|---|---|---|
| GET | `/notifications` | Logged in | Returns own notifications and the unread count |
| PATCH | `/notifications/:id/read` | Logged in | Marks one notification as read |
| PATCH | `/notifications/read-all` | Logged in | Marks all notifications as read |

Use `?unread=true` to get only unread notifications.

### Users and activity

| Method | URL | Access | What it does |
|---|---|---|---|
| GET | `/users` | Admin | Returns all users, can filter with `?role=admin` |
| GET | `/users/admins` | Admin | Returns all admins for the assignee list |
| PATCH | `/users/:id/role` | Admin | Changes the role of a user, own role can not be changed |
| GET | `/activity` | Admin | Returns recent activity of all tickets |

Role body:

```json
{ "role": "admin" }
```

### Health

| Method | URL | Access | What it does |
|---|---|---|---|
| GET | `/health` | Public | Checks that the server is running |

### Status codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | Deleted |
| 400 | Wrong input |
| 401 | Not logged in, wrong login or invalid token |
| 403 | Not allowed |
| 404 | Not found, also for tickets of other users |
| 409 | Email already exists |
| 429 | Too many login or register attempts (20 in 15 minutes) |
| 500 | Server error |

## Events

| Event | When | Notification to | Email to owner |
|---|---|---|---|
| `ticket.created` | A ticket is created | Admins | No |
| `ticket.updated` | Ticket details are changed | Owner if an admin changed it, otherwise support | No |
| `ticket.status_changed` | Admin changes the status | Owner | Yes |
| `ticket.priority_changed` | Admin changes the priority | Owner | No |
| `ticket.assigned` | Admin changes the assignee | New assignee | No |
| `ticket.resolved` | Status becomes resolved | Owner | Yes |
| `comment.added` | A comment is added | Owner if an admin commented, otherwise support | Yes, if an admin commented |
| `ticket.deleted` | A ticket is deleted | Nobody | No |

Every event is saved in the activity log. Support means the assigned admin, or all admins if nobody is assigned. Users do not get notifications for their own actions.

## Database

MongoDB with Mongoose is used. A ticket fits well as a document because its data is read together. Users, tickets and comments are connected with ObjectId references.

### Relations

```
User   1 ---- many  Ticket        (createdBy)
User   1 ---- many  Ticket        (assignedTo, only admins)
Ticket 1 ---- many  Comment       (ticket)
User   1 ---- many  Comment       (author)
User   1 ---- many  Notification  (recipient)
Ticket 1 ---- many  Notification  (ticket)
Ticket 1 ---- many  ActivityLog   (ticket)
User   1 ---- many  ActivityLog   (actor)
```

### Collections

| Collection | What it stores | Fields |
|---|---|---|
| `users` | User and admin accounts | name, email (unique), password (hashed), role |
| `tickets` | Support tickets | ticketNumber (unique), title, description, category, priority, status, createdBy, assignedTo, commentCount, resolvedAt |
| `comments` | Comments on tickets | ticket, author, body |
| `notifications` | Notifications of a user | recipient, event, ticket, title, message, read |
| `activitylogs` | History of actions | event, ticket, actor, message, metadata |
| `counters` | Last ticket number | _id, seq |

All collections except counters also have `createdAt` and `updatedAt`.

### Indexes

| Collection | Index | Used for |
|---|---|---|
| users | email (unique) | Login and no duplicate accounts |
| tickets | ticketNumber (unique) | Search by `TCK-1001` |
| tickets | createdBy, createdAt | Ticket list of one user |
| tickets | status, priority, createdAt | Admin filters |
| comments | ticket, createdAt | Comments of one ticket in order |
| notifications | recipient, read, createdAt | Notification list and unread count |
| activitylogs | ticket, createdAt | Activity of one ticket |
| activitylogs | createdAt | Recent activity on the dashboard |

### Why it is designed like this

- **Comments are in their own collection.** A ticket can have many comments, and this keeps the ticket document small.
- **commentCount is saved on the ticket.** The ticket list can show the count without counting comments every time.
- **Ticket numbers come from the counters collection.** `$inc` is atomic, so two tickets created at the same time get different numbers.
- **Activity logs and notifications are separate.** Activity is the history of a ticket, and notifications belong to one user.
- **Deleting a ticket** also deletes its comments and notifications. Activity logs are kept as history.

## Implementation decisions

- **Structure:** routes only define URLs, controllers handle the request, models define the data, and utils have shared helper functions. This keeps each file small and easy to find.
- **Authentication:** login returns a JWT which the client sends in the `Authorization` header. The user is loaded from the database on every request, so a role change works immediately.
- **Authorization:** the `adminOnly` middleware protects admin routes. `findTicket` checks the owner of a ticket. For another user's ticket the API returns 404, so nobody can check if a ticket exists.
- **Separate admin update route:** users edit content with `PATCH /tickets/:id`. Status, priority and assignee are changed by admins with `PATCH /tickets/:id/manage`, so a user can not change the status by adding it in the request.
- **Edit and delete rule:** a user can edit or delete a ticket only while it is open, because after that support is already working on it.
- **Events:** controllers emit events with Node's `EventEmitter` after the data is saved. `listeners.events.js` saves the activity log, creates notifications and sends emails. If a listener fails, the request still works.
- **Validation:** every input is checked before it reaches the database. Login fields must be strings, so MongoDB operators like `{"$gt": ""}` are rejected.
- **Security:** passwords are hashed with bcrypt, login and register are rate limited, and helmet and CORS are used.
- **Emails:** real emails are sent only if the SMTP settings are added. Without them the email is only printed in the console.

### Limitations

- The token is saved in `localStorage`, which is simple but less safe than an httpOnly cookie.
- Sorting by priority or status and the dashboard counts load all matching tickets, which is fine for small data but should be moved to the database for large data.
- Notifications are refreshed every 30 seconds, not in real time.
