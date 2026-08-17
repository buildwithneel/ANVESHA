import React from 'react';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { mockCameras } from '../data/mockCameras';

export function SystemCamerasPage() {
  const cameraColumns = [
    { header: 'Camera ID', accessorKey: 'id', className: 'font-mono font-bold' },
    { header: 'Camera Name', accessorKey: 'name' },
    { header: 'Division', accessorKey: 'division' },
    { header: 'Zone / Location', accessorKey: 'locationDescription' },
    { header: 'Resolution', accessorKey: 'resolution', className: 'font-mono text-xs' },
    { header: 'FPS', accessorKey: 'fps', className: 'font-mono text-xs' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 rg-card bg-surface border-border">
        <h1 className="text-base font-semibold text-text-primary">Station CCTV Camera Inventory</h1>
        <p className="text-xs text-text-muted">Master camera directory, stream resolution configurations, and status monitoring</p>
      </div>

      <DataTable columns={cameraColumns} data={mockCameras} />
    </div>
  );
}

export default SystemCamerasPage;
