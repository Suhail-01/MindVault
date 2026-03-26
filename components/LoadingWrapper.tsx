'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { Loader } from '@/components/Loader';

export function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return <>{children}</>;
}
