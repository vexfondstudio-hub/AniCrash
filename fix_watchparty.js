import fs from 'fs';

let content = fs.readFileSync('src/components/WatchPartyView.tsx', 'utf8');

// 1. Add latestRoomRef
if (!content.includes("latestRoomRef = useRef")) {
  content = content.replace("const channelRef = useRef<any | null>(null);", "const channelRef = useRef<any | null>(null);\n  const latestRoomRef = useRef<WatchPartyRoom | null>(null);\n  useEffect(() => {\n    latestRoomRef.current = currentRoom;\n  }, [currentRoom]);");
}

// 2. Fix 'JOIN' event
const joinReplacement = `case 'JOIN':
            setSyncStatusNotice(\`\${data.senderName} присоединился к просмотру\`);
            
            // Auto-sync for the new user if we are the host
            if (latestRoomRef.current && latestRoomRef.current.hostId === currentUser.username) {
               const r = latestRoomRef.current;
               setTimeout(() => {
                 channelRef.current?.send({
                   type: 'broadcast',
                   event: 'room_event',
                   payload: {
                     type: 'EPISODE_CHANGE',
                     animeId: r.animeId,
                     episodeNumber: r.episodeNumber,
                     senderName: 'Авто-синхронизация'
                   }
                 });
                 
                 setTimeout(() => {
                   if (videoRef.current) {
                     channelRef.current?.send({
                       type: 'broadcast',
                       event: 'room_event',
                       payload: {
                         type: videoRef.current.paused ? 'PAUSE' : 'PLAY',
                         time: videoRef.current.currentTime,
                         senderName: 'Авто-синхронизация'
                       }
                     });
                   }
                 }, 500);
               }, 1000);
            }
            break;`;

content = content.replace(/case 'JOIN':\s*setSyncStatusNotice\([^)]+\);\s*break;/g, joinReplacement);

// 3. Fix Force Sync to also send EPISODE_CHANGE
const forceSyncTarget = `const handleForceSync = () => {
    if (!videoRef.current || !channelRef.current) return;`;
const forceSyncReplacement = `const handleForceSync = () => {
    if (!videoRef.current || !channelRef.current || !currentRoom) return;
    
    // Send episode state first
    channelRef.current.send({
      type: 'broadcast',
      event: 'room_event',
      payload: {
        type: 'EPISODE_CHANGE',
        animeId: currentRoom.animeId,
        episodeNumber: currentRoom.episodeNumber,
        senderName: \`\${currentUser.username} (Хост)\`,
      }
    });
    
    // Then time state`;

content = content.replace(forceSyncTarget, forceSyncReplacement);

fs.writeFileSync('src/components/WatchPartyView.tsx', content);
