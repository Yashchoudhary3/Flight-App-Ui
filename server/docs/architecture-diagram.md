# System Architecture Diagram

```
+-------------------+        HTTPS/API        +-------------------+
|                   | <--------------------> |                   |
|   React Frontend  |                       |   Node.js Backend  |
|  (client)         |                       |   (server)         |
+-------------------+                       +-------------------+
         |                                         |
         | Supabase Auth (JWT, user info)          |
         +-------------------+                     |
                             |                     |
                             v                     v
                      +-------------------+   +-------------------+
                      |  Supabase Auth    |   |  PostgreSQL DB    |
                      +-------------------+   +-------------------+
```

**Description:**
- The React frontend communicates with the Node.js backend via REST APIs (secured with JWT).
- The backend handles business logic, booking, flight management, and interacts with the PostgreSQL database (hosted on Supabase).
- Supabase Auth manages user authentication and issues JWTs for secure access.
- Real-time updates are handled via SSE from backend to frontend. 