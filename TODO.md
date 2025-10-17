# TODO: Fix Authentication and API Integration for Forum App

## Tasks

- [x] Update isLoggedIn() function in Home.jsx, Thread.jsx, CreateThread.jsx to check localStorage.getItem("authToken")
- [x] Update Thread.jsx to fetch thread data from /api/threads/:id and posts from /api/threads/:id/posts
- [x] Implement posting replies in Thread.jsx to /api/threads/:id/posts
- [x] Update CreateThread.jsx to post new threads to /api/threads
- [x] Ensure navigation from homepage to thread page works (verify)

## Followup steps

- [ ] Test login/logout functionality
- [ ] Verify thread creation and replies only visible when logged in
- [ ] Test API calls for fetching and posting data
