import { useRef, useState } from 'react';

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  function point(event) {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * canvas.width / bounds.width, y: (event.clientY - bounds.top) * canvas.height / bounds.height };
  }
  function start(event) {
    const canvas = canvasRef.current;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    const context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(x, y);
  }
  function move(event) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const { x, y } = point(event);
    const context = canvas.getContext('2d');
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#153a32';
    context.lineTo(x, y);
    context.stroke();
    setHasInk(true);
    onChange(canvas.toDataURL('image/png'));
  }
  function stop() {
    drawing.current = false;
  }
  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange('');
  }

  return (
    <div className="signature-wrap">
      <canvas ref={canvasRef} width="720" height="180" aria-label="Draw your signature"
        onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} />
      <div className="signature-foot">
        <span>{hasInk ? 'Signature captured' : 'Sign above using your mouse or touch screen'}</span>
        <button className="text-button" type="button" onClick={clear}>Clear</button>
      </div>
    </div>
  );
}
