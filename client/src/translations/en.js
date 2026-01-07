export default {
  app: {
    title: 'Live Location Tracker',
    subtitle: 'Real-time group coordination and tracking'
  },
  setup: {
    createRoom: 'Create New Room (Leader)',
    joinRoom: 'Join Existing Room',
    name: 'Your Name',
    roomCode: 'Room Code',
    chooseColor: 'Choose your color',
    uploadPhoto: 'Upload Your Photo',
    chooseIcon: 'Or choose an icon',
    createAndStart: 'Create Room & Start Tracking',
    joinAndStart: 'Join Room & Start Tracking',
    backToSetup: 'Back to Setup'
  },
  room: {
    roomLabel: 'Room',
    role: 'Role',
    leader: 'Leader',
    member: 'Member',
    members: 'Members',
    leaveRoom: 'Leave Room',
    online: 'Online',
    offline: 'Offline',
    lastSeen: 'Last seen'
  },
  leader: {
    controls: 'Leader Controls',
    destinationRoute: 'Destination Route',
    noDestinations: 'No destinations added yet. Click on the map to add destinations.',
    exportRoute: 'Export Route',
    togglePaths: 'Toggle Path History',
    pathsShown: 'Paths Shown',
    pathsHidden: 'Paths Hidden',
    current: 'Current',
    completed: 'Completed',
    destination: 'Destination'
  },
  map: {
    street: 'Street',
    satellite: 'Satellite',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    trackLocation: 'Track my location',
    stopTrackingLocation: 'Stop tracking my location',
    trackDestination: 'Track current destination',
    stopTrackingDestination: 'Stop tracking destination',
    switchTo: 'Switch to',
    view: 'view',
    currentDestination: 'Current Destination',
    added: 'Added',
    accuracy: 'Accuracy'
  },
  export: {
    json: 'JSON',
    gpx: 'GPX',
    csv: 'CSV'
  },
  notifications: {
    pathHistory: 'Path history',
    shown: 'shown',
    hidden: 'hidden',
    exporting: 'Exporting route as',
    failed: 'Failed to export route'
  }
}
