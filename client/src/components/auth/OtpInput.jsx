import { useRef } from 'react';

export function OtpInput({ value = '', onChange }) {
  const inputs = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  function updateDigit(index, char) {
    const next = [...digits];
    next[index] = char;
    onChange(next.join('').replace(/\D/g, ''));
  }

  function handleChange(e, index) {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    updateDigit(index, char);
    if (char && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        updateDigit(index - 1, '');
        inputs.current[index - 1]?.focus();
      } else {
        updateDigit(index, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6).trimEnd() || pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputs.current[focusIndex]?.focus();
  }

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width: '48px',
            height: '56px',
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-h)',
            background: 'transparent',
            border: `2px solid ${d ? 'var(--accent)' : 'var(--accent-border)'}`,
            borderRadius: '10px',
            outline: 'none',
            caretColor: 'var(--accent)',
            transition: 'border-color 0.15s',
            fontFamily: 'var(--mono)',
            boxShadow: d ? '0 0 0 3px var(--accent-bg)' : 'none',
          }}
        />
      ))}
    </div>
  );
}
