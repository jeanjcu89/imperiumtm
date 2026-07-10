import { useEffect, useState } from 'react';

// True below the breakpoint; updates live on resize/rotation.
export default function useIsMobile(query = '(max-width: 820px)') {
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    setMobile(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return mobile;
}
