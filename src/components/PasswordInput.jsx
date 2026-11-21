import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Hide password' : 'Show password';

  return <span className="password-input-wrap">
    <input {...props} type={visible ? 'text' : 'password'} />
    <button
      type="button"
      className="password-visibility-toggle"
      aria-label={label}
      aria-pressed={visible}
      onClick={() => setVisible((current) => !current)}
    >
      {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
    </button>
  </span>;
}
