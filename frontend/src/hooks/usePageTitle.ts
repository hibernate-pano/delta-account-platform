import { useEffect } from 'react';

const BASE_TITLE = 'DeltaHub - 三角洲行动账号交易平台';

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | DeltaHub` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
