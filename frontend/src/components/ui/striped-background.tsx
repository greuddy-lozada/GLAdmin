'use client';

import { motion } from 'motion/react';

const beams = [
  { color: [158, 228, 147], originX: '0%', originY: '30%', width: '120vw', height: 200, rotate: [-35, 35] },
  { color: [134, 187, 216], originX: '100%', originY: '20%', width: '100vw', height: 160, rotate: [30, -40] },
  { color: [218, 247, 220], originX: '50%', originY: '10%', width: '90vw', height: 180, rotate: [-25, 25] },
  { color: [47, 72, 88], originX: '20%', originY: '50%', width: '110vw', height: 140, rotate: [20, -30] },
  { color: [158, 228, 147], originX: '80%', originY: '60%', width: '80vw', height: 120, rotate: [-40, 20] },
  { color: [134, 187, 216], originX: '0%', originY: '70%', width: '100vw', height: 150, rotate: [15, -45] },
];

const spots = [
  { size: 60, x: [20, 80, 30], y: [40, 20, 60], color: 'rgba(158, 228, 147, 0.6)' },
  { size: 45, x: [70, 10, 50], y: [30, 70, 20], color: 'rgba(218, 247, 220, 0.5)' },
  { size: 35, x: [50, 90, 10], y: [60, 10, 50], color: 'rgba(134, 187, 216, 0.6)' },
  { size: 50, x: [10, 60, 80], y: [70, 40, 10], color: 'rgba(158, 228, 147, 0.4)' },
  { size: 40, x: [40, 20, 70], y: [20, 60, 40], color: 'rgba(218, 247, 220, 0.5)' },
];

export function StripedBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, #2F4858 0%, #86BBD8 100%)',
        }}
      />
      {beams.map((beam, i) => (
        <motion.div
          key={`b${i}`}
          className="absolute"
          style={{
            width: beam.width,
            height: beam.height,
            left: 0,
            top: 0,
            transformOrigin: `${beam.originX} ${beam.originY}`,
            background: `linear-gradient(180deg, rgba(${beam.color[0]}, ${beam.color[1]}, ${beam.color[2]}, 0.3) 0%, rgba(${beam.color[0]}, ${beam.color[1]}, ${beam.color[2]}, 0) 100%)`,
            filter: 'blur(50px)',
          }}
          animate={{ rotate: beam.rotate }}
          transition={{
            duration: 4 + i * 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
            repeatType: 'mirror',
          }}
        />
      ))}
      {spots.map((spot, i) => (
        <motion.div
          key={`s${i}`}
          className="absolute rounded-full"
          style={{
            width: spot.size,
            height: spot.size,
            background: `radial-gradient(circle, ${spot.color} 0%, transparent 70%)`,
            filter: 'blur(3px)',
          }}
          animate={{
            left: spot.x.map((v) => `${v}%`),
            top: spot.y.map((v) => `${v}%`),
          }}
          transition={{
            duration: 6 + i * 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
            repeatType: 'mirror',
          }}
        />
      ))}
    </div>
  );
}
