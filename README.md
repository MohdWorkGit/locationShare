# Live Location Tracker

A real-time group coordination and location tracking web application built with React.js and Node.js.

## Features

- **Room-Based System**: Create tracking rooms with auto-generated codes
- **Leader/Member Roles**: Designated leader can coordinate and monitor team members
- **Real-Time Location Tracking**: HTML5 Geolocation + WebSocket updates
- **Interactive Map**: Leaflet.js powered map with custom markers
  - **Map Type Toggle**: Switch between Street and Satellite views
  - **Collapsible Sidebar**: Expand map to full screen
  - **Full-Screen Mode**: Hide header for maximum map visibility
- **Photo Upload**: Users can upload custom profile photos (up to 10MB) or choose emoji icons
  - Photos displayed on map markers and member lists
  - Automatic base64 encoding for easy storage
- **Path Tracking**: Records and displays movement history for all members
- **Member Management**: Custom names, colors, photo/icon profiles, and online status
- **Global Destination Route**: Leaders create a route of destinations for all members
  - Click on map to add destinations to the route
  - **Current destination shows leader's icon/photo** (larger, orange marker)
  - Numbered waypoints with current/visited status indicators (red→orange→green)
  - Set active destination for team navigation
  - Visual path connecting all destinations
  - Export route in multiple formats (JSON, GPX, CSV)

## Tech Stack

### Frontend
- React.js 18.x
- React Leaflet for mapping
- Socket.IO client for real-time communication
- Vite for build tooling
- Axios for API calls

### Backend
- Node.js with Express.js
- Socket.IO for WebSocket connections
- In-memory storage (can be extended to use database)

## Project Structure

```
locationShare/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API and Socket services
│   │   └── styles/        # CSS files
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── socket/        # Socket.IO handlers
│   │   └── server.js      # Main server file
│   └── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd locationShare
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

## Running the Application

### Option 1: Docker (Recommended)

The easiest way to run the application is using Docker:

```bash
# Build and start both frontend and backend
docker-compose up -d

# Access the application at http://localhost
```

See [DOCKER.md](DOCKER.md) for detailed Docker documentation.

### Option 2: Development Mode

1. **Configure environment (optional)**
   ```bash
   cd client
   cp .env.example .env
   # For development with separate servers, add:
   # VITE_API_URL=http://localhost:5000
   # VITE_SOCKET_URL=http://localhost:5000
   ```

2. **Start the backend server** (Terminal 1)
   ```bash
   cd server
   npm run dev
   ```
   Server will run on http://localhost:5000

3. **Start the frontend** (Terminal 2)
   ```bash
   cd client
   npm run dev
   ```
   Client will run on http://localhost:3000

4. **Access the application**
   Open your browser and navigate to http://localhost:3000

**Note:** In development, Vite automatically proxies `/api` requests to `localhost:5000` (configured in `vite.config.js`), so you don't need to set environment variables unless you want to override this behavior.

## Usage

### Creating a Room (Leader)
1. Click "Create New Room (Leader)"
2. Enter your name
3. Choose your color
4. Upload a profile photo OR choose an emoji icon
5. Click "Create Room & Start Tracking"
6. Share the generated room code with team members

### Joining a Room (Member)
1. Click "Join Existing Room"
2. Enter the room code provided by the leader
3. Enter your name
4. Choose your color
5. Upload a profile photo OR choose an emoji icon
6. Click "Join Room & Start Tracking"

### Leader Features
- **View all member locations** in real-time on the map
- **Create destination routes**:
  - Click anywhere on the map to add destinations to the route
  - Destinations are added as numbered waypoints
  - All members see the same destination route
- **Manage destination route**:
  - Set which destination is currently active
  - Remove individual destinations from the route
  - Clear the entire route
- **Export routes**: Download the destination path as JSON, GPX, or CSV
- **Toggle member path history** to see movement trails
- **Member management**: View all members with their status and last seen time

### Member Features
- See your real-time location on the map
- View the global destination route set by the leader
- See current active destination highlighted
- View other team members' locations
- Receive notifications when destinations are added or changed

### Permissions
The application requires location permissions to track your position. Make sure to allow location access when prompted by your browser.

## API Endpoints

### REST API
- `POST /api/rooms` - Create a new room
- `POST /api/rooms/:roomCode/join` - Join an existing room
- `GET /api/rooms/:roomCode` - Get room details
- `POST /api/rooms/:roomCode/leave` - Leave a room
- `GET /api/rooms/:roomCode/export?format={json|gpx|csv}` - Export destination path

### Socket.IO Events

#### Client to Server
- `join-room` - Join a room via socket
- `location-update` - Send location update
- `add-destination-to-path` - Add destination to global route (leader only)
- `remove-destination-from-path` - Remove destination from route (leader only)
- `clear-destination-path` - Clear entire destination route (leader only)
- `set-current-destination-index` - Set active destination (leader only)
- `get-location-history` - Request location history

#### Server to Client
- `room-state` - Current room state (includes destination path)
- `user-joined` - New user joined notification
- `user-left` - User left notification
- `location-updated` - Location update from another user
- `destination-path-updated` - Destination route modified
- `current-destination-updated` - Active destination changed
- `location-history` - Historical location data

## Production Build

### Build the frontend
```bash
cd client
npm run build
```

### Build output will be in `client/dist`

### Serve the production build
You can serve the built frontend using the backend server or any static file server.

## Environment Variables

### Docker Deployment
For Docker, configure the `.env` file in the project root:
```bash
# Leave empty for single-domain deployment with nginx proxy (recommended)
VITE_API_URL=
VITE_SOCKET_URL=

# OR set for separate frontend/backend domains
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
```

See [DOCKER.md](DOCKER.md) for detailed Docker configuration.

### Development
For local development, create `client/.env`:
```bash
# Optional - only needed if not using Vite's built-in proxy
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Server
Optional `.env` file in the server directory:
```bash
PORT=5000
NODE_ENV=production
```

### Available Client Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL (without `/api` suffix) | No |
| `VITE_SOCKET_URL` | WebSocket/Socket.IO server URL | No |

**Default behavior:** When not set, the app uses relative URLs which work through nginx proxy or Vite's dev proxy.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- [Leaflet.js](https://leafletjs.com/) for the mapping library
- [Socket.IO](https://socket.io/) for real-time communication
- [OpenStreetMap](https://www.openstreetmap.org/) for map tiles
- [React](https://react.dev/) for the frontend framework
- [Express.js](https://expressjs.com/) for the backend framework
