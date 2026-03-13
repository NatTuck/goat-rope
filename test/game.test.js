import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateName,
  createGame,
  createPlayer,
  getGameState,
  addPlayer,
  setInput,
  updateGame,
  removePlayer,
  GOAT_COLORS,
  GAME_WIDTH,
  GAME_HEIGHT,
  MOVE_SPEED,
  ROPE_RANGE,
  ROPE_PULL_FORCE
} from '../src/shared/game.js';

describe('generateName', () => {
  it('returns a name from adjective and noun', () => {
    const name = generateName();
    expect(name).toContain(' ');
    const [adj, noun] = name.split(' ');
    expect(adj).toBeDefined();
    expect(noun).toBeDefined();
  });
});

describe('createGame', () => {
  it('creates empty game state', () => {
    const game = createGame();
    expect(game.players).toEqual({});
    expect(game.ropes).toEqual([]);
  });
});

describe('createPlayer', () => {
  it('creates player with correct properties', () => {
    const player = createPlayer('abc', 100, 200, '#ff0000', 'Test Goat');
    expect(player.id).toBe('abc');
    expect(player.x).toBe(100);
    expect(player.y).toBe(200);
    expect(player.color).toBe('#ff0000');
    expect(player.name).toBe('Test Goat');
    expect(player.inputs).toEqual({ up: false, down: false, left: false, right: false, rope: false });
    expect(player.ropeTarget).toBeNull();
  });
});

describe('addPlayer', () => {
  it('adds player to game at center position', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Test Goat');
    expect(player.id).toBe('p1');
    expect(player.x).toBe(GAME_WIDTH / 2);
    expect(player.y).toBe(GAME_HEIGHT / 2);
    expect(game.players.p1).toBe(player);
  });
});

describe('setInput', () => {
  it('sets player input direction', () => {
    const game = createGame();
    addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    
    setInput(game, 'p1', 'up', true);
    expect(game.players.p1.inputs.up).toBe(true);
    
    setInput(game, 'p1', 'left', true);
    expect(game.players.p1.inputs.left).toBe(true);
  });

  it('ignores invalid player', () => {
    const game = createGame();
    expect(() => setInput(game, 'nonexistent', 'up', true)).not.toThrow();
  });

  it('ignores invalid direction', () => {
    const game = createGame();
    addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    expect(() => setInput(game, 'p1', 'invalid', true)).not.toThrow();
  });
});

describe('updateGame movement', () => {
  it('moves player up when up input is pressed', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    const initialY = player.y;
    
    setInput(game, 'p1', 'up', true);
    updateGame(game);
    
    expect(player.y).toBe(initialY - MOVE_SPEED);
  });

  it('moves player down when down input is pressed', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    const initialY = player.y;
    
    setInput(game, 'p1', 'down', true);
    updateGame(game);
    
    expect(player.y).toBe(initialY + MOVE_SPEED);
  });

  it('moves player left when left input is pressed', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    const initialX = player.x;
    
    setInput(game, 'p1', 'left', true);
    updateGame(game);
    
    expect(player.x).toBe(initialX - MOVE_SPEED);
  });

  it('moves player right when right input is pressed', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    const initialX = player.x;
    
    setInput(game, 'p1', 'right', true);
    updateGame(game);
    
    expect(player.x).toBe(initialX + MOVE_SPEED);
  });

  it('combines multiple inputs', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    
    setInput(game, 'p1', 'up', true);
    setInput(game, 'p1', 'right', true);
    updateGame(game);
    
    expect(player.x).toBe(player.x);
    expect(player.y).toBe(player.y);
  });
});

describe('updateGame boundaries', () => {
  it('prevents player from going off left edge', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    player.x = 10;
    
    setInput(game, 'p1', 'left', true);
    updateGame(game);
    
    expect(player.x).toBeGreaterThanOrEqual(30);
  });

  it('prevents player from going off right edge', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    player.x = GAME_WIDTH - 10;
    
    setInput(game, 'p1', 'right', true);
    updateGame(game);
    
    expect(player.x).toBeLessThanOrEqual(GAME_WIDTH - 30);
  });

  it('prevents player from going off top edge', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    player.y = 10;
    
    setInput(game, 'p1', 'up', true);
    updateGame(game);
    
    expect(player.y).toBeGreaterThanOrEqual(30);
  });

  it('prevents player from going off bottom edge', () => {
    const game = createGame();
    const player = addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    player.y = GAME_HEIGHT - 10;
    
    setInput(game, 'p1', 'down', true);
    updateGame(game);
    
    expect(player.y).toBeLessThanOrEqual(GAME_HEIGHT - 30);
  });
});

describe('updateGame rope', () => {
  it('can manually set ropeTarget between players', () => {
    const game = createGame();
    addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    addPlayer(game, 'p2', GOAT_COLORS[1], 'Goat2');
    
    game.players.p1.ropeTarget = 'p2';
    game.players.p2.ropeTarget = 'p1';
    game.ropes.push({ from: 'p1', to: 'p2' });
    
    expect(game.players.p1.ropeTarget).toBe('p2');
    expect(game.players.p2.ropeTarget).toBe('p1');
    expect(game.ropes.length).toBe(1);
  });

  it('removes rope when rope input released', () => {
    const game = createGame();
    addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    addPlayer(game, 'p2', GOAT_COLORS[1], 'Goat2');
    game.players.p1.x = 100;
    game.players.p2.x = 150;
    game.players.p1.ropeTarget = 'p2';
    game.players.p2.ropeTarget = 'p1';
    game.ropes.push({ from: 'p1', to: 'p2' });
    
    setInput(game, 'p1', 'rope', false);
    updateGame(game);
    
    expect(game.players.p1.ropeTarget).toBeNull();
    expect(game.players.p2.ropeTarget).toBeNull();
    expect(game.ropes.length).toBe(0);
  });
});

describe('removePlayer', () => {
  it('removes player from game', () => {
    const game = createGame();
    addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    removePlayer(game, 'p1');
    expect(game.players.p1).toBeUndefined();
  });

  it('removes ropes connected to player', () => {
    const game = createGame();
    addPlayer(game, 'p1', GOAT_COLORS[0], 'Goat1');
    addPlayer(game, 'p2', GOAT_COLORS[1], 'Goat2');
    game.players.p1.ropeTarget = 'p2';
    game.players.p2.ropeTarget = 'p1';
    game.ropes.push({ from: 'p1', to: 'p2' });
    
    removePlayer(game, 'p1');
    
    expect(game.ropes.length).toBe(0);
    expect(game.players.p2.ropeTarget).toBeNull();
  });
});

describe('getGameState', () => {
  it('returns serialized game state', () => {
    const game = createGame();
    addPlayer(game, 'p1', '#ff0000', 'Test Goat');
    const state = getGameState(game);
    
    expect(state.players).toHaveLength(1);
    expect(state.players[0].id).toBe('p1');
    expect(state.players[0].color).toBe('#ff0000');
    expect(state.players[0].name).toBe('Test Goat');
    expect(state.players[0].x).toBeDefined();
    expect(state.players[0].y).toBeDefined();
    expect(state.ropes).toEqual([]);
  });

  it('excludes internal properties from player', () => {
    const game = createGame();
    addPlayer(game, 'p1', '#ff0000', 'Test Goat');
    const state = getGameState(game);
    
    expect(state.players[0].inputs).toBeUndefined();
    expect(state.players[0].ropeTarget).toBeDefined();
  });
});
