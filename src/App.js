// src/App.js
import React, { useRef, useEffect, useState } from 'react';
import './App.css';

function forwardKinematics(q1, q2, L1 = 100, L2 = 75) {
  const t1 = (q1 * Math.PI) / 180;
  const t2 = (q2 * Math.PI) / 180;
  const x1 = L1 * Math.cos(t1),  y1 = L1 * Math.sin(t1);
  const x2 = x1 + L2 * Math.cos(t1 + t2),
        y2 = y1 + L2 * Math.sin(t1 + t2);
  return [{ x: 0, y: 0 }, { x: x1, y: y1 }, { x: x2, y: y2 }];
}

export default function App() {
  const canvasRef = useRef(null);
  const [q1, setQ1] = useState('0');
  const [q2, setQ2] = useState('0');
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const draw = () => {
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const ox = W / 2, oy = H / 2;
    const step = 50, max = 200;

    // parse inputs
    const n1 = parseFloat(q1) || 0;
    const n2 = parseFloat(q2) || 0;
    const pts = forwardKinematics(n1, n2);
    setPos({ x: pts[2].x, y: pts[2].y });

    // clear & white bg
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
    for (let x = ox % step; x <= W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = oy % step; y <= H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();

    // tick labels
    ctx.fillStyle = '#000'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    for (let v = -max; v <= max; v += step) {
      if (v === 0) continue;
      // X axis
      ctx.fillText(v.toString(), ox + v, oy + 15);
      // Y axis
      ctx.textAlign = 'right';
      ctx.fillText(v.toString(), ox - 5, oy - v + 4);
      ctx.textAlign = 'center';
    }

    // ====== DRAW LINKS AND JOINTS WITH SEPARATE COLORS ======

    // define colors
    const linkColors = ['#001f3f', '#004080'];          // dark navy, medium blue
    const jointColors = ['#001f3f', '#004080', '#007ACC']; // base, mid, tip

    // first link (p0 → p1)
    ctx.strokeStyle = linkColors[0];
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ox + pts[0].x, oy - pts[0].y);
    ctx.lineTo(ox + pts[1].x, oy - pts[1].y);
    ctx.stroke();

    // second link (p1 → p2)
    ctx.strokeStyle = linkColors[1];
    ctx.beginPath();
    ctx.moveTo(ox + pts[1].x, oy - pts[1].y);
    ctx.lineTo(ox + pts[2].x, oy - pts[2].y);
    ctx.stroke();

    // draw joints (p0, p1, p2) with three shades
    pts.forEach((p, i) => {
      ctx.fillStyle = jointColors[i];
      ctx.beginPath();
      ctx.arc(ox + p.x, oy - p.y, 6, 0, 2 * Math.PI);
      ctx.fill();
    });

    // outer border
    ctx.strokeStyle = '#007ACC';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, W, H);
  };

  useEffect(draw, []);
  useEffect(draw, [q1, q2]);

  return (
    <div className="container">
      <div className="controls">
        <h2>
          Manipulador Robótico<br/>2D — 2 Degree of Freedom (DOF)
        </h2>
        <label>
          q1 (Θ):
          <input
            type="number"
            value={q1}
            onChange={e => setQ1(e.target.value)}
          />
        </label>
        <label>
          q2 (Θ):
          <input
            type="number"
            value={q2}
            onChange={e => setQ2(e.target.value)}
          />
        </label>
        <button className="btn-big" onClick={draw}>
          Atualizar Posição
        </button>
      </div>

      <div className="plot">
        <div className="coords-outside">
          X={pos.x.toFixed(1)} | Y={pos.y.toFixed(1)}
        </div>
        <canvas ref={canvasRef} width={800} height={650} />
      </div>
    </div>
  );
}
