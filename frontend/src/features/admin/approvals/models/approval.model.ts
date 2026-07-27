export interface AdminApproval {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  performedById: string;
  performedAt: string;
  approvedById: string | null;
  approvedAt: string | null;
  status: 'pending' | 'approved' | 'rejected';
  metadata: Record<string, unknown>;
  rejectionReason: string | null;
  performedBy: { id: string; firstName: string; lastName: string; email: string };
  approvedBy: { id: string; firstName: string; lastName: string; email: string } | null;
}
