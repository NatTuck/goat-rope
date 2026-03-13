import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
import express from 'express';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GOAT_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6'];
const ADJECTIVES = ['Fluffy', 'Spiky', 'Thunder', 'Nugget', 'Bouncy', 'Grumpy', 'Fuzzy', 'Sneaky', 'Chill', 'Zippy', 'Grunty', 'Wobbly'];
const NOUNS = ['Storm', 'Taco', 'Ninja', 'Captain', 'Pudge', 'Rocket', 'Muffin', 'Blitz', 'Chomp', 'Waffle', 'Zap', 'Bean'];

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GOAT_SIZE = 60;
const ROPE_RANGE = 150;
const ROPE_PULL_FORCE = 3;
const MOVE_SPEED = 4;

let players = {};
let ropes = [];
let io;

function generateName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

function getGameState() {
  return {
    players: Object.values(players).map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      color: p.color,
      name: p.name,
      ropeTarget: p.ropeTarget
    })),
    ropes
  };
}

function setupSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', () => {
      const usedColors = Object.values(players).map(p => p.color);
      const availableColor = GOAT_COLORS.find(c => !usedColors.includes(c));

      if (!availableColor || Object.keys(players).length >= 4) {
        socket.emit('full', { message: 'Game is full' });
        socket.disconnect();
        return;
      }

      players[socket.id] = {
        id: socket.id,
        x: Math.random() * (GAME_WIDTH - GOAT_SIZE * 2) + GOAT_SIZE,
        y: Math.random() * (GAME_HEIGHT - GOAT_SIZE * 2) + GOAT_SIZE,
        color: availableColor,
        name: generateName(),
        inputs: { up: false, down: false, left: false, right: false, rope: false },
        ropeTarget: null
      };

      socket.emit('assigned', {
        id: socket.id,
        color: availableColor,
        name: players[socket.id].name
      });

      io.emit('gameState', getGameState());
    });

    socket.on('input', ({ dir, pressed }) => {
      if (players[socket.id]) {
        players[socket.id].inputs[dir] = pressed;
      }
    });

    socket.on('disconnect', () => {
      const player = players[socket.id];
      if (player) {
        ropes = ropes.filter(r => r.from !== socket.id && r.to !== socket.id);
        delete players[socket.id];
        Object.values(players).forEach(p => {
          if (p.ropeTarget === socket.id) {
            p.ropeTarget = null;
          }
        });
        io.emit('gameState', getGameState());
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  setInterval(updateGame, 1000 / 60);
}

function updateGame() {
  const playerIds = Object.keys(players);

  playerIds.forEach(id => {
    const p = players[id];
    if (!p) return;

    if (p.inputs.left) p.x -= MOVE_SPEED;
    if (p.inputs.right) p.x += MOVE_SPEED;
    if (p.inputs.up) p.y -= MOVE_SPEED;
    if (p.inputs.down) p.y += MOVE_SPEED;

    p.x = Math.max(GOAT_SIZE / 2, Math.min(GAME_WIDTH - GOAT_SIZE / 2, p.x));
    p.y = Math.max(GOAT_SIZE / 2, Math.min(GAME_HEIGHT - GOAT_SIZE / 2, p.y));

    if (p.inputs.rope && !p.ropeTarget) {
      let closest = null;
      let closestDist = ROPE_RANGE;

      playerIds.forEach(otherId => {
        if (otherId === id) return;
        const other = players[otherId];
        if (!other) return;
        if (other.ropeTarget === id) return;

        const dx = other.x - p.x;
        const dy = other.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < closestDist) {
          closestDist = dist;
          closest = otherId;
        }
      });

      if (closest) {
        p.ropeTarget = closest;
        players[closest].ropeTarget = id;
        ropes.push({ from: id, to: closest });
      }
    }

    if (!p.inputs.rope && p.ropeTarget) {
      const target = players[p.ropeTarget];
      if (target) {
        target.ropeTarget = null;
      }
      p.ropeTarget = null;
      ropes = ropes.filter(r =>
        !(r.from === id || r.to === id)
      );
    }
  });

  playerIds.forEach(id => {
    const p = players[id];
    if (!p || !p.ropeTarget) return;

    const target = players[p.ropeTarget];
    if (!target) return;

    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 30) {
      const pull = ROPE_PULL_FORCE;
      const nx = dx / dist;
      const ny = dy / dist;

      p.x += nx * pull;
      p.y += ny * pull;
      target.x -= nx * pull;
      target.y -= ny * pull;
    }
  });

  if (io) {
    io.emit('gameState', getGameState());
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'socket-server',
      configureServer(server) {
        setupSocketIO(server.httpServer);
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
});
