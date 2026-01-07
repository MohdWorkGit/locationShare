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
  memberList: {
    groupMembers: 'Group Members',
    locationShared: 'Location shared',
    noLocation: 'No location'
  },
  leader: {
    controls: 'Leader Controls',
    addDestinations: 'Add Destinations',
    addDestinationsHint: 'Click anywhere on the map to add a destination to the route',
    showPaths: 'Show',
    hidePaths: 'Hide',
    memberPaths: 'Member Paths',
    clearRoute: 'Clear Route',
    confirmClearPath: 'Are you sure you want to clear the entire destination path?',
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
  destinationPath: {
    removeDestination: 'Remove destination',
    confirmRemove: 'Are you sure you want to remove this destination?'
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
    failed: 'Failed to export route',
    leftRoom: 'Left room successfully'
  }
}
