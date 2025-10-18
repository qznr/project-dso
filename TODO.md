# TODO: Fix Thread Creation Display on Homepage and Thread Page

## Steps to Complete

1. **Update Vite Config for API Proxy**

   - Add proxy configuration in `app2-fe/vite.config.js` to route `/api` requests to `http://localhost:3002` (backend server).

2. **Update Backend Thread Detail API**

   - Modify `getThreadDetail` in `app2/src/controllers/thread.controller.js` to include posts with author and likes count.

3. **Fix Data Mapping in Home Page**

   - Update `app2-fe/src/pages/Home.jsx` to correctly map API response data to frontend expected fields (id, username, createdAt, etc.).

4. **Add Refetch Mechanism for Homepage**

   - Implement localStorage flag in `CreateThread.jsx` to trigger refetch on homepage after thread creation.

5. **Update Thread Page Data Handling**

   - Adjust `app2-fe/src/pages/Thread.jsx` to use correct fields from updated API response.

6. **Test the Fix**
   - Start backend on port 3002 and frontend on port 3001.
   - Create a new thread and verify it appears on homepage and thread detail page.
