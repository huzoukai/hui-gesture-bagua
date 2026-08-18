export function distance2d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mirrorLandmarks(landmarks) {
  return landmarks.map((point) => ({
    x: 1 - point.x,
    y: point.y,
    z: point.z ?? 0
  }));
}

export function classifyHand(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 21) {
    return {
      gesture: 'none',
      points: [],
      metrics: null
    };
  }

  const points = mirrorLandmarks(landmarks);
  const wrist = points[0];
  const ratios = {};

  [
    [8, 5, 'index'],
    [12, 9, 'middle'],
    [16, 13, 'ring'],
    [20, 17, 'pinky']
  ].forEach(([tip, base, name]) => {
    ratios[name] =
      distance2d(points[tip], wrist) /
      Math.max(distance2d(points[base], wrist), 0.0001);
  });

  const extended = {
    index: ratios.index > 1.3,
    middle: ratios.middle > 1.3,
    ring: ratios.ring > 1.3,
    pinky: ratios.pinky > 1.3
  };

  const extendedCount = Object.values(extended).filter(Boolean).length;
  const openPalm =
    extendedCount >= 3 && distance2d(points[4], points[20]) > 0.18;
  const fist = Math.max(...Object.values(ratios)) < 1.18;
  const pointing =
    ratios.index > 1.28 &&
    ratios.middle < ratios.index - 0.15 &&
    ratios.ring < ratios.index - 0.15 &&
    !openPalm;

  let gesture = 'neutral';
  if (pointing) gesture = 'point';
  else if (fist) gesture = 'fist';
  else if (openPalm) gesture = 'palm';

  return {
    gesture,
    points,
    metrics: {
      ratios,
      extendedCount,
      fingerLength: distance2d(points[5], points[8]),
      palm: points[9],
      wrist,
      roll: Math.atan2(
        points[5].y - points[17].y,
        points[5].x - points[17].x
      )
    }
  };
}
