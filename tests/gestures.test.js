import { describe, expect, it } from 'vitest';
import { classifyHand, mirrorLandmarks } from '../src/gestures.js';

function baseHand() {
  return Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.72, z: 0 }));
}

function pointingHand() {
  const hand = baseHand();
  hand[0] = { x: 0.5, y: 0.9, z: 0 };
  hand[5] = { x: 0.44, y: 0.66, z: 0 };
  hand[8] = { x: 0.43, y: 0.2, z: 0 };
  hand[9] = { x: 0.49, y: 0.65, z: 0 };
  hand[12] = { x: 0.49, y: 0.78, z: 0 };
  hand[13] = { x: 0.55, y: 0.66, z: 0 };
  hand[16] = { x: 0.55, y: 0.78, z: 0 };
  hand[17] = { x: 0.61, y: 0.69, z: 0 };
  hand[20] = { x: 0.61, y: 0.8, z: 0 };
  hand[4] = { x: 0.36, y: 0.72, z: 0 };
  return hand;
}

function openHand() {
  const hand = baseHand();
  hand[0] = { x: 0.5, y: 0.92, z: 0 };
  [
    [5, 8, 0.38],
    [9, 12, 0.46],
    [13, 16, 0.55],
    [17, 20, 0.64]
  ].forEach(([base, tip, x]) => {
    hand[base] = { x, y: 0.66, z: 0 };
    hand[tip] = { x, y: 0.18, z: 0 };
  });
  hand[4] = { x: 0.24, y: 0.52, z: 0 };
  return hand;
}

function fistHand() {
  const hand = baseHand();
  hand[0] = { x: 0.5, y: 0.92, z: 0 };
  [
    [5, 8, 0.4],
    [9, 12, 0.47],
    [13, 16, 0.54],
    [17, 20, 0.61]
  ].forEach(([base, tip, x]) => {
    hand[base] = { x, y: 0.65, z: 0 };
    hand[tip] = { x, y: 0.79, z: 0 };
  });
  hand[4] = { x: 0.42, y: 0.75, z: 0 };
  return hand;
}

describe('gesture classification', () => {
  it('mirrors the camera x coordinate', () => {
    expect(mirrorLandmarks([{ x: 0.2, y: 0.4, z: 0 }])[0].x).toBeCloseTo(0.8);
  });

  it('recognizes a pointing index finger', () => {
    expect(classifyHand(pointingHand()).gesture).toBe('point');
  });

  it('recognizes an open palm', () => {
    expect(classifyHand(openHand()).gesture).toBe('palm');
  });

  it('recognizes a fist', () => {
    expect(classifyHand(fistHand()).gesture).toBe('fist');
  });

  it('returns none for incomplete landmarks', () => {
    expect(classifyHand([]).gesture).toBe('none');
  });
});
