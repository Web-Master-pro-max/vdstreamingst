const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const CHAT_DATA_FILE = path.join(__dirname, '../data/public_chat.json');

class RealtimeService {
  constructor() {
    this.io = null;
    this.messages = [];
    this.partyRooms = new Map(); // roomId -> { showId, ep, hostSocketId, hostUser, controlMode, markers: [], members: Set<socketId>, userNames: Map }
    this.lastSoundTimes = new Map(); // socketId -> timestamp
    this.poll = {
      id: 'poll-battle-2026',
      question: '⚡ Most Hyped Anime Battle of All Time?',
      options: [
        { id: 'opt-1', text: 'Naruto vs Sasuke (Final Valley)', votes: 142 },
        { id: 'opt-2', text: 'Sukuna vs Satoru Gojo (Shinjuku)', votes: 218 },
        { id: 'opt-3', text: 'Luffy Gear 5 vs Kaido (Onigashima)', votes: 175 },
        { id: 'opt-4', text: 'Sung Jin-woo vs Ant King (Jeju Island)', votes: 160 }
      ],
      totalVotes: 695,
      active: true
    };
    this.loadMessages();
  }

  loadMessages() {
    try {
      if (fs.existsSync(CHAT_DATA_FILE)) {
        const raw = fs.readFileSync(CHAT_DATA_FILE, 'utf8');
        this.messages = JSON.parse(raw);
      } else {
        this.messages = [
          {
            id: 'init-1',
            user: 'InfinxBot',
            role: 'BOT',
            text: 'Welcome to the Infinx Anime community live chat! Chat with other fans watching right now.',
            time: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now() - 3600000
          },
          {
            id: 'init-2',
            user: 'Kenji',
            role: 'VIP',
            text: 'Anyone watching Naruto Shippuden or Solo Leveling today? The fight scenes are insane!',
            time: new Date(Date.now() - 1800000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now() - 1800000
          }
        ];
        this.saveMessages();
      }
    } catch (err) {
      console.error('[RealtimeService] Error loading public chat messages:', err.message);
      this.messages = [];
    }
  }

  saveMessages() {
    try {
      const dataDir = path.dirname(CHAT_DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (this.messages.length > 150) {
        this.messages = this.messages.slice(-150);
      }
      fs.writeFileSync(CHAT_DATA_FILE, JSON.stringify(this.messages, null, 2), 'utf8');
    } catch (err) {
      console.error('[RealtimeService] Error saving public chat messages:', err.message);
    }
  }

  getPublicMessages() {
    return this.messages;
  }

  getPublicPoll() {
    return this.poll;
  }

  votePoll(optionId) {
    if (!this.poll || !optionId) return this.poll;
    const option = this.poll.options.find(o => o.id === optionId);
    if (option) {
      option.votes += 1;
      this.poll.totalVotes += 1;
      if (this.io) {
        this.io.emit('chat:poll_update', this.poll);
      }
    }
    return this.poll;
  }

  addPublicMessage(user = 'OtakuFan', text = '', role = 'MEMBER', extra = {}) {
    const cleanText = String(text || '').trim();
    if (!cleanText && !extra.sticker && !extra.gif) return null;

    const message = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      user: String(user || 'OtakuFan').trim().slice(0, 30),
      role: role || 'MEMBER',
      text: cleanText.slice(0, 500),
      avatar: extra.avatar || null,
      avatarFrame: extra.avatarFrame || 'default',
      sticker: extra.sticker || null,
      gif: extra.gif || null,
      mention: extra.mention || null,
      level: extra.level || 1,
      rank: extra.rank || 'GENIN',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    this.messages.push(message);
    this.saveMessages();

    if (this.io) {
      this.io.emit('chat:message', message);
    }

    return message;
  }

  deletePublicMessage(messageId) {
    if (!messageId) return false;
    const initialLen = this.messages.length;
    this.messages = this.messages.filter(m => String(m.id) !== String(messageId));
    if (this.messages.length !== initialLen) {
      this.saveMessages();
      if (this.io) {
        this.io.emit('chat:message_deleted', { id: messageId });
      }
      return true;
    }
    return false;
  }

  attach(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 30000,
      pingInterval: 15000
    });

    console.log('⚡ Realtime WebSocket Service (Socket.io) attached with Next-Gen Co-Watching & Live Polls');

    this.io.on('connection', (socket) => {
      // 1. PUBLIC CHAT & POLLS
      socket.on('chat:join', () => {
        socket.join('public-chat');
        socket.emit('chat:history', this.messages);
        socket.emit('chat:poll_update', this.poll);
      });

      const handleIncomingChatMessage = (data = {}) => {
        const text = data.text || '';
        const user = data.user || 'OtakuFan';
        const role = data.role || 'MEMBER';
        this.addPublicMessage(user, text, role, {
          avatar: data.avatar,
          avatarFrame: data.avatarFrame,
          sticker: data.sticker,
          gif: data.gif,
          mention: data.mention,
          level: data.level,
          rank: data.rank
        });
      };

      socket.on('chat:message', handleIncomingChatMessage);
      socket.on('chat:send', handleIncomingChatMessage);

      // Admin message deletion event
      socket.on('chat:delete', (payload = {}) => {
        const { messageId, token } = payload;
        if (!messageId) return;
        let isAdmin = false;
        if (token) {
          try {
            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'infinx_anime_jwt_secret_key_9981';
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && (decoded.role === 'ADMIN' || decoded.userRole === 'ADMIN')) {
              isAdmin = true;
            }
          } catch (e) {}
        }
        if (isAdmin) {
          this.deletePublicMessage(messageId);
        }
      });

      socket.on('chat:poll_vote', (payload = {}) => {
        if (payload.optionId) {
          this.votePoll(payload.optionId);
        }
      });

      // 2. WATCH PARTY ADVANCED ENGINE
      socket.on('party:join', (payload = {}) => {
        const rawId = payload.roomId || payload.partyId;
        if (!rawId) return;
        const normalizedRoomId = String(rawId).trim().toUpperCase();
        socket.join(normalizedRoomId);
        socket.data.partyRoom = normalizedRoomId;
        socket.data.partyUser = payload.user || 'PartyGuest';

        if (!this.partyRooms.has(normalizedRoomId)) {
          this.partyRooms.set(normalizedRoomId, {
            roomId: normalizedRoomId,
            showId: payload.showId || null,
            ep: Number(payload.ep) || 1,
            hostSocketId: socket.id,
            hostUser: socket.data.partyUser,
            controlMode: 'open', // 'open' | 'host_only'
            markers: [],
            members: new Set(),
            userNames: new Map(),
            currentTime: typeof payload.currentTime === 'number' ? payload.currentTime : 0,
            isPlaying: false,
            lastSyncTimestamp: Date.now(),
            isTransitioning: false
          });
        }

        const room = this.partyRooms.get(normalizedRoomId);
        room.members.add(socket.id);
        room.userNames.set(socket.id, socket.data.partyUser);

        // If room show/ep was unset or host joined, update room details
        if (payload.showId && !room.showId) room.showId = payload.showId;
        if (payload.ep && !room.ep) room.ep = Number(payload.ep);

        let estimatedCurrentTime = room.currentTime || 0;
        if (room.isPlaying && room.lastSyncTimestamp) {
          const elapsed = (Date.now() - room.lastSyncTimestamp) / 1000;
          if (elapsed > 0 && elapsed < 7200) {
            estimatedCurrentTime += elapsed;
          }
        }

        const joinPayload = {
          user: socket.data.partyUser,
          peerCount: room.members.size,
          memberCount: room.members.size,
          hostUser: room.hostUser,
          controlMode: room.controlMode
        };

        socket.to(normalizedRoomId).emit('party:peer_joined', joinPayload);
        socket.to(normalizedRoomId).emit('party:member_joined', joinPayload);

        socket.emit('party:joined', {
          roomId: normalizedRoomId,
          partyId: normalizedRoomId,
          peerCount: room.members.size,
          memberCount: room.members.size,
          isHost: room.hostSocketId === socket.id,
          hostUser: room.hostUser,
          controlMode: room.controlMode,
          markers: room.markers,
          showId: room.showId,
          ep: room.ep,
          currentTime: estimatedCurrentTime,
          isPlaying: !!room.isPlaying
        });

        // Request authoritative live playback state from host if joining an active room
        if (room.hostSocketId && room.hostSocketId !== socket.id) {
          this.io.to(room.hostSocketId).emit('party:request_state_for_guest', {
            guestSocketId: socket.id
          });
        }
      });

      // Host responds with precise playback state for newly joined guest
      socket.on('party:respond_state_for_guest', (payload = {}) => {
        const guestSocketId = payload.guestSocketId;
        if (!guestSocketId) return;
        const roomId = socket.data.partyRoom;
        if (roomId && this.partyRooms.has(roomId)) {
          const room = this.partyRooms.get(roomId);
          if (typeof payload.currentTime === 'number') {
            room.currentTime = payload.currentTime;
            room.isPlaying = !!payload.isPlaying;
            room.lastSyncTimestamp = Date.now();
          }
        }
        this.io.to(guestSocketId).emit('party:live_state_sync', {
          currentTime: payload.currentTime,
          isPlaying: payload.isPlaying,
          showId: payload.showId,
          ep: payload.ep
        });
      });

      // Host Control Mode Toggle (DJ Controls)
      socket.on('party:set_control_mode', (payload = {}) => {
        const roomId = socket.data.partyRoom;
        if (!roomId || !this.partyRooms.has(roomId)) return;
        const room = this.partyRooms.get(roomId);

        // Only current host can toggle control mode
        if (room.hostSocketId !== socket.id) return;

        room.controlMode = payload.mode === 'host_only' ? 'host_only' : 'open';
        this.io.to(roomId).emit('party:control_mode_changed', {
          controlMode: room.controlMode,
          hostUser: room.hostUser
        });
      });

      // Request Control from Host
      socket.on('party:request_control', () => {
        const roomId = socket.data.partyRoom;
        if (!roomId || !this.partyRooms.has(roomId)) return;
        const room = this.partyRooms.get(roomId);

        if (room.hostSocketId && room.hostSocketId !== socket.id) {
          this.io.to(room.hostSocketId).emit('party:control_requested', {
            user: socket.data.partyUser,
            socketId: socket.id
          });
        }
      });

      // Pass Host Crown
      socket.on('party:pass_host', (payload = {}) => {
        const roomId = socket.data.partyRoom;
        if (!roomId || !this.partyRooms.has(roomId)) return;
        const room = this.partyRooms.get(roomId);

        if (room.hostSocketId !== socket.id) return;

        // Find new host socket
        let targetSocketId = payload.targetSocketId;
        if (!targetSocketId && payload.targetUser) {
          for (const [sId, uName] of room.userNames.entries()) {
            if (uName === payload.targetUser && sId !== socket.id) {
              targetSocketId = sId;
              break;
            }
          }
        }

        if (targetSocketId && room.members.has(targetSocketId)) {
          room.hostSocketId = targetSocketId;
          room.hostUser = room.userNames.get(targetSocketId) || 'New Host';

          this.io.to(roomId).emit('party:host_changed', {
            newHost: room.hostUser,
            hostSocketId: targetSocketId
          });
        }
      });

      // Auto-Binge Synchronized Episode Transition (Debounced and Host-checked)
      socket.on('party:next_episode', (payload = {}) => {
        const roomId = socket.data.partyRoom;
        if (!roomId || !this.partyRooms.has(roomId)) return;
        const room = this.partyRooms.get(roomId);

        // In host-only mode, only the host can transition episodes
        if (room.controlMode === 'host_only' && socket.id !== room.hostSocketId) {
          return;
        }

        // Prevent auto-binge storm / multiple rapid triggers
        if (room.isTransitioning) return;
        room.isTransitioning = true;
        setTimeout(() => {
          if (room) room.isTransitioning = false;
        }, 8000);

        const targetShowId = payload.showId || room.showId;
        const targetEp = Number(payload.ep) || (Number(room.ep || 1) + 1);

        room.showId = targetShowId;
        room.ep = targetEp;
        room.currentTime = 0;
        room.isPlaying = true;
        room.lastSyncTimestamp = Date.now();

        // Broadcast episode navigation to all peers in room
        this.io.to(roomId).emit('party:navigate_episode', {
          showId: targetShowId,
          ep: targetEp,
          sender: socket.data.partyUser || 'Host',
          partyId: roomId
        });
      });

      // Synchronize Playback (play, pause, seek) with Host Mode respect & Revert on unauthorized
      socket.on('party:sync', (payload = {}) => {
        const roomId = socket.data.partyRoom;
        if (!roomId || !this.partyRooms.has(roomId)) return;
        const room = this.partyRooms.get(roomId);

        // If host-only mode is active, only the host can trigger sync
        if (room.controlMode === 'host_only' && socket.id !== room.hostSocketId) {
          // Tell the unauthorized guest to revert back to host state
          socket.emit('party:sync_revert', {
            action: room.isPlaying ? 'play' : 'pause',
            time: room.currentTime,
            hostUser: room.hostUser,
            message: `Controls locked by Host (${room.hostUser})`
          });
          return;
        }

        const time = payload.time !== undefined ? payload.time : payload.currentTime;
        if (typeof time === 'number') {
          room.currentTime = time;
          room.lastSyncTimestamp = Date.now();
        }
        if (payload.action === 'play') {
          room.isPlaying = true;
          room.lastSyncTimestamp = Date.now();
        } else if (payload.action === 'pause') {
          room.isPlaying = false;
          room.lastSyncTimestamp = Date.now();
        }

        socket.to(roomId).emit('party:sync', {
          action: payload.action,
          time: time,
          currentTime: time,
          sender: payload.sender || socket.data.partyUser || 'Friend',
          timestamp: Date.now()
        });
      });

      // Timeline Hype Markers
      socket.on('party:add_marker', (payload = {}) => {
        const roomId = socket.data.partyRoom;
        if (!roomId || !this.partyRooms.has(roomId)) return;
        const room = this.partyRooms.get(roomId);

        const markerTime = Number(payload.time) || 0;
        const userName = socket.data.partyUser || 'Friend';
        const markerLabel = (payload.label || 'Hype Moment').slice(0, 30);

        // Deduplicate in room.markers if same user & close timestamp (< 1s)
        const isDuplicate = room.markers.some(m =>
          (payload.id && m.id === payload.id) ||
          (Math.abs(m.time - markerTime) < 1.0 && m.user === userName && m.label === markerLabel)
        );
        if (isDuplicate) return;

        const marker = {
          id: payload.id || ('mk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
          time: markerTime,
          emoji: payload.emoji || '🔥',
          label: markerLabel,
          user: userName,
          timestamp: Date.now()
        };

        room.markers.push(marker);
        if (room.markers.length > 20) room.markers.shift();

        // Broadcast to other peers in the room (sender already rendered it optimistically)
        socket.to(roomId).emit('party:marker_added', marker);
      });

      // Hype Soundboard with Rate Limiting (1 per 2.5s)
      socket.on('party:sound', (payload = {}) => {
        const roomId = socket.data.partyRoom;
        if (!roomId) return;

        const now = Date.now();
        const last = this.lastSoundTimes.get(socket.id) || 0;
        if (now - last < 2500) return; // Drop spam
        this.lastSoundTimes.set(socket.id, now);

        socket.to(roomId).emit('party:sound', {
          soundId: payload.soundId,
          soundName: payload.soundName || 'Hype Sound',
          user: socket.data.partyUser || 'Friend'
        });
      });

      // Live Emoji Reactions
      socket.on('party:reaction', (payload = {}) => {
        const roomId = socket.data.partyRoom;
        if (!roomId) return;

        socket.to(roomId).emit('party:reaction', {
          emoji: payload.emoji,
          user: payload.user || socket.data.partyUser || 'Friend',
          sender: payload.sender || payload.user || socket.data.partyUser || 'Friend',
          timestamp: Date.now()
        });
      });

      // In-Party Chat
      socket.on('party:chat', (payload = {}) => {
        const roomId = socket.data.partyRoom;
        if (!roomId) return;

        const chatMsg = {
          user: socket.data.partyUser || 'Friend',
          text: String(payload.text || '').trim().slice(0, 300),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };

        this.io.to(roomId).emit('party:chat', chatMsg);
      });

      // Dedicated Party Leave Handler (Does NOT sever the socket connection)
      const handlePartyLeave = (s) => {
        const roomId = s.data.partyRoom;
        if (roomId && this.partyRooms.has(roomId)) {
          const room = this.partyRooms.get(roomId);
          room.members.delete(s.id);
          room.userNames.delete(s.id);
          s.leave(roomId);
          s.data.partyRoom = null;

          const leavePayload = {
            user: s.data.partyUser,
            peerCount: room.members.size,
            memberCount: room.members.size
          };
          this.io.to(roomId).emit('party:peer_left', leavePayload);
          this.io.to(roomId).emit('party:member_left', leavePayload);

          // If host left, elect next member as host
          if (room.hostSocketId === s.id && room.members.size > 0) {
            const nextHostSocketId = Array.from(room.members)[0];
            room.hostSocketId = nextHostSocketId;
            room.hostUser = room.userNames.get(nextHostSocketId) || 'Host';

            this.io.to(roomId).emit('party:host_changed', {
              newHost: room.hostUser,
              hostSocketId: nextHostSocketId
            });
          }

          if (room.members.size === 0) {
            this.partyRooms.delete(roomId);
          }
        }
      };

      socket.on('party:leave', () => {
        handlePartyLeave(socket);
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        handlePartyLeave(socket);
        this.lastSoundTimes.delete(socket.id);
      });
    });
  }
}

module.exports = new RealtimeService();
