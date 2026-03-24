'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ItemsGrid } from '@/components/ItemsGrid';

export default function Archive() {
  return (
    <DashboardLayout>
      <ItemsGrid 
        title="Archive" 
        description="Items you've archived for later."
        filter={(item) => item.is_archived}
      />
    </DashboardLayout>
  );
}
