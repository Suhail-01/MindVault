'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ItemsGrid } from '@/components/ItemsGrid';

export default function Favorites() {
  return (
    <DashboardLayout>
      <ItemsGrid 
        title="Favorites" 
        description="Items you've marked as important."
        filter={(item) => item.is_favorite && !item.is_archived}
      />
    </DashboardLayout>
  );
}
