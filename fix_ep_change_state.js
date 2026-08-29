import fs from 'fs';

let content = fs.readFileSync('src/components/WatchPartyView.tsx', 'utf8');

const target = `case 'EPISODE_CHANGE':
            setSelectedAnimeId(data.animeId);
            setSelectedEpisodeNum(data.episodeNum);
            setSyncStatusNotice(\`\${data.senderName} переключил серию\`);
            break;`;

const replacement = `case 'EPISODE_CHANGE':
            setCurrentRoom(prev => prev ? {
               ...prev,
               animeId: data.animeId,
               episodeNumber: data.episodeNum
            } : null);
            setSyncStatusNotice(\`\${data.senderName} переключил серию\`);
            break;`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/WatchPartyView.tsx', content);
