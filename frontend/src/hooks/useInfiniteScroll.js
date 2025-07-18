import { useState, useEffect, useCallback } from 'react';

export const useInfiniteScroll = (fetchMore) => {
  const [loading, setLoading] = useState(false);

  const handleScroll = useCallback(() => {
    if (loading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setLoading(true);
      fetchMore().finally(() => setLoading(false));
    }
  }, [fetchMore, loading]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { loading };
};

export default useInfiniteScroll;