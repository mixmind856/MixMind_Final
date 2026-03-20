# Live Playlist Rotation - 3-Step API Implementation

## Overview
The live playlist rotation system has been simplified to use a 3-step API flow that runs every 2 minutes instead of the complex browser automation logic.

## New Architecture

### Three-Step API Flow
Each rotation cycle executes the following steps:

1. **Go to Mixmind Folder**
   ```
   GET http://127.0.0.1:80/execute?script=browser_gotofolder%20%22beatsource%3A%5CMixmind%22
   ```

2. **Scroll to Index**
   ```
   GET http://127.0.0.1:80/execute?script=browser_scroll%20{i}
   ```
   Where `{i}` cycles from 0 to 499 (for 500 songs), then resets to 0.

3. **Add Song to Playlist**
   ```
   GET http://127.0.0.1:80/execute?script=playlist_add
   ```

### Rotation Cycle
- **Default Interval**: 2 minutes (120,000ms)
- **Total Songs**: 500 (indices 0-499)
- **Cycling**: When reaching song 500, index resets to 0
- **Error Handling**: On failure, the system waits 30s before retrying (but continues cycling through songs)

## Configuration

Set these environment variables in your `.env` file:

```env
# Execute API Configuration
EXECUTE_API_URL=http://127.0.0.1:80

# Live Playlist Rotation Settings
TOTAL_SONGS=500
ROTATION_INTERVAL_MS=120000
```

### Configuration Details
- `TOTAL_SONGS`: Number of songs in the beatsource:\Mixmind folder (default: 500)
- `ROTATION_INTERVAL_MS`: Time between rotations in milliseconds (default: 120000 = 2 minutes)
  - For 1 minute: `60000`
  - For 30 seconds: `30000`

## Implementation Details

### Files Modified
1. **backend/api/requests/requests.controller.js**
   - Added `executeLivePlaylistRotation()` function
   - Exported for external use

2. **backend/worker/runLivePlaylistFlow.js**
   - Fully refactored with simplified `simplifiedLivePlaylistRotation()` function
   - Removed all old Playwright browser automation code
   - Uses axios for HTTP requests to execute API

3. **backend/package.json**
   - Added `axios` dependency for HTTP requests

### Removed Code
The following complex functions were removed:
- `updateTrackDurationsInDatabase()`
- `emptyPlaylist()`
- `removeTopNTracks()`
- `getTrackDurations()`
- `getRandomTracksFromBeatsourcePlaylist()`
- `addTracksToLivePlaylist()`
- `continuousBatchRotationLoop()`

### Log Output
The rotation system provides detailed logging:
```
═══════════════════════════════════════════════════════════════════════════
🎵 SIMPLIFIED LIVE PLAYLIST ROTATION STARTED
═══════════════════════════════════════════════════════════════════════════
📂 Total Songs: 500
⏱️  Rotation Interval: 120s (2 minutes)
📊 Session: [sessionId]
═══════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────
🎵 ROTATION #1 | Index: 0/499
────────────────────────────────────────────────────────────────────────────
📍 Step 1: Going to Mixmind folder...
✓ Step 1 completed: { status: 'success' }
📍 Step 2: Scrolling to index 0...
✓ Step 2 completed: { status: 'success' }
📍 Step 3: Adding song to playlist...
✓ Step 3 completed: { status: 'success' }
✅ Rotation #1 completed successfully
⏳ Waiting 120s before next rotation...
```

## Usage

### Automatic (via Worker)
The live playlist rotation starts automatically when:
1. A venue toggles `livePlaylistActive: true`
2. The worker manager spawns `runLivePlaylistFlow.js`
3. The worker continuously rotates songs every 2 minutes

### Manual (via Controller)
```javascript
const { executeLivePlaylistRotation } = require('./api/requests/requests.controller');

// Start rotation with default settings
await executeLivePlaylistRotation();

// Or with custom configuration
await executeLivePlaylistRotation({
  baseUrl: 'http://127.0.0.1:80',
  totalSongs: 500,
  intervalMs: 120000  // 2 minutes
});
```

## Error Handling

- **Failed Step**: If any step fails, the system logs the error and throws
- **Rotation Retry**: On error, the system waits 30 seconds and retries
- **Song Index**: Still advances to next song even if rotation fails (prevents getting stuck)
- **Graceful Shutdown**: Responds to SIGTERM and SIGINT signals to stop cleanly

## Performance Benefits

1. **Simplicity**: Removed ~600 lines of complex browser automation code
2. **Reliability**: Direct API calls instead of Playwright browser handling
3. **Resource Usage**: No browser process overhead
4. **Maintainability**: Easy to adjust timing and song count
5. **Responsiveness**: Faster API-based approach

## Troubleshooting

### Rotations Not Starting
- Check if worker is running: `ps aux | grep runLivePlaylistFlow`
- Verify `EXECUTE_API_URL` in environment variables
- Check logs for SIGTERM/SIGINT signals

### API Endpoint Not Responding
- Verify execute API is running on port 80
- Test endpoint manually: `curl http://127.0.0.1:80/execute?script=...`

### Songs Not Adding
- Check if beatsource:\Mixmind folder exists
- Verify playlist_add API is working
- Check Mixmind playlist permissions

## Related Functions

The system works in conjunction with:
- **Song Requests**: User requests still trigger the 3-step flow immediately
- **Venue Controller**: Manages worker lifecycle (start/stop)
- **Worker Manager**: Spawns and monitors the worker process
