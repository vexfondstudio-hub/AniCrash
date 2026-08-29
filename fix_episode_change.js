import fs from 'fs';

let content = fs.readFileSync('src/components/WatchPartyView.tsx', 'utf8');

content = content.replace(
  "type: 'EPISODE_CHANGE',\n        episodeNumber: epNum,\n        senderName: currentUser.username,",
  "type: 'EPISODE_CHANGE',\n        animeId: currentRoom.animeId,\n        episodeNum: epNum,\n        senderName: currentUser.username,"
);

// Also in ForceSync I used episodeNumber instead of episodeNum
content = content.replace(
  "type: 'EPISODE_CHANGE',\n        animeId: currentRoom.animeId,\n        episodeNumber: currentRoom.episodeNumber,\n        senderName: `${currentUser.username} (Хост)`,",
  "type: 'EPISODE_CHANGE',\n        animeId: currentRoom.animeId,\n        episodeNum: currentRoom.episodeNumber,\n        senderName: `${currentUser.username} (Хост)`,"
);

// And in auto-sync:
content = content.replace(
  "type: 'EPISODE_CHANGE',\n                     animeId: r.animeId,\n                     episodeNumber: r.episodeNumber,\n                     senderName: 'Авто-синхронизация'",
  "type: 'EPISODE_CHANGE',\n                     animeId: r.animeId,\n                     episodeNum: r.episodeNumber,\n                     senderName: 'Авто-синхронизация'"
);

fs.writeFileSync('src/components/WatchPartyView.tsx', content);

