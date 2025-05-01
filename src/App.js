import React, { useRef, useEffect, useState } from 'react';
import './App.css';

function forwardKinematics(q1, q2, L1, L2) {
  const t1 = (q1 * Math.PI) / 180;
  const t2 = (q2 * Math.PI) / 180;
  const x1 = L1 * Math.cos(t1),  y1 = L1 * Math.sin(t1);
  const x2 = x1 + L2 * Math.cos(t1 + t2),
        y2 = y1 + L2 * Math.sin(t1 + t2);
  return [{ x: 0, y: 0 }, { x: x1, y: y1 }, { x: x2, y: y2 }];
}

export default function App() {
  const canvasRef = useRef(null);

  // joint angles
  const [q1, setQ1] = useState('0');
  const [q2, setQ2] = useState('45');

  // link lengths
  const [L1, setL1] = useState('50');
  const [L2, setL2] = useState('50');

  // target for IK
  const [target, setTarget] = useState({ x: '0', y: '0' });

  // computed end-effector position
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Draw function uses current q1, q2, L1, L2
  const draw = () => {
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const ox = W / 2, oy = H / 2;
    const step = 50, max = 200;

    // parse values
    const a1 = parseFloat(q1) || 0;
    const a2 = parseFloat(q2) || 0;
    const l1 = parseFloat(L1) || 0;
    const l2 = parseFloat(L2) || 0;

    // forward kinematics
    const pts = forwardKinematics(a1, a2, l1, l2);
    setPos({ x: pts[2].x, y: pts[2].y });

    // clear + white background
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H);

    // grid
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
    for(let x = ox%step; x<=W; x+=step){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }
    for(let y = oy%step; y<=H; y+=step){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0,oy); ctx.lineTo(W,oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox,0); ctx.lineTo(ox,H); ctx.stroke();

    // tick labels
    ctx.fillStyle = '#000'; ctx.font='12px sans-serif'; ctx.textAlign='center';
    for(let v=-max; v<=max; v+=step){
      if(v===0) continue;
      ctx.fillText(v.toString(), ox+v, oy+15);
      ctx.textAlign='right';
      ctx.fillText(v.toString(), ox-5, oy-v+4);
      ctx.textAlign='center';
    }

    // colored links & joints
    const linkColors = ['#001f3f','#004080'];
    const jointColors = ['#001f3f','#004080','#007ACC'];

    // link 0→1
    ctx.strokeStyle = linkColors[0]; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ox+pts[0].x, oy-pts[0].y);
    ctx.lineTo(ox+pts[1].x, oy-pts[1].y);
    ctx.stroke();

    // link 1→2
    ctx.strokeStyle = linkColors[1];
    ctx.beginPath();
    ctx.moveTo(ox+pts[1].x, oy-pts[1].y);
    ctx.lineTo(ox+pts[2].x, oy-pts[2].y);
    ctx.stroke();

    // joints
    pts.forEach((p,i) => {
      ctx.fillStyle = jointColors[i];
      ctx.beginPath();
      ctx.arc(ox+p.x, oy-p.y, 6, 0, 2*Math.PI);
      ctx.fill();
    });

    // outer border
    ctx.strokeStyle = '#007ACC'; ctx.lineWidth = 2;
    ctx.strokeRect(0,0,W,H);
  };

  // inverse kinematics calculation
  const computeIK = () => {
    const x = parseFloat(target.x) || 0;
    const y = parseFloat(target.y) || 0;
    const l1 = parseFloat(L1) || 0;
    const l2 = parseFloat(L2) || 0;
    const r2 = x*x + y*y;
    const cos2 = (r2 - l1*l1 - l2*l2) / (2*l1*l2);
    if (cos2 < -1 || cos2 > 1) {
      alert('Ponto fora do alcance!');
      return;
    }
    const th2 = Math.acos(cos2);           // “elbow-up”
    const k1 = l1 + l2*Math.cos(th2);
    const k2 = l2*Math.sin(th2);
    const th1 = Math.atan2(y, x) - Math.atan2(k2, k1);
    setQ1((th1*180/Math.PI).toFixed(1));
    setQ2((th2*180/Math.PI).toFixed(1));
    // redraw after setting
    setTimeout(draw, 0);
  };

  // initial draw & redraw when dependencies change
  useEffect(draw, []);
  useEffect(draw, [q1, q2, L1, L2]);

  return (
    <div className="container">
      <div className="controls">
        <h2>Manipulador Robótico<br/>2D — 2 DOF</h2>

        <label>q1 (θ):
          <input type="number" value={q1} onChange={e=>setQ1(e.target.value)} />
        </label>
        <label>q2 (θ):
          <input type="number" value={q2} onChange={e=>setQ2(e.target.value)} />
        </label>

        <label>L1 (px):
          <input type="number" value={L1} onChange={e=>setL1(e.target.value)} />
        </label>
        <label>L2 (px):
          <input type="number" value={L2} onChange={e=>setL2(e.target.value)} />
        </label>

        <label>X desejado:
          <input
            type="number"
            value={target.x}
            onChange={e=>setTarget(prev=>({...prev, x:e.target.value}))}
          />
        </label>
        <label>Y desejado:
          <input
            type="number"
            value={target.y}
            onChange={e=>setTarget(prev=>({...prev, y:e.target.value}))}
          />
        </label>

        <button className="btn-big" onClick={computeIK}>
          Calcular Ângulos
        </button>
        <button className="btn-big" onClick={draw}>
          Atualizar Posição
        </button>
      </div>

      <div className="plot">
        <div className="coords-outside">
          Valores atuais de: X={pos.x.toFixed(1)}, Y={pos.y.toFixed(1)}
        </div>
        <canvas ref={canvasRef} width={800} height={600} />
      </div>
    </div>
  );
}
