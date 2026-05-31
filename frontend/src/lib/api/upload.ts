const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function uploadFile(file: File): Promise<string> {
  const token = localStorage.getItem('accessToken');
  const orgId = localStorage.getItem('currentOrgId');

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (orgId) headers['x-organization-id'] = orgId;

  const response = await fetch(`${API_URL}/uploads/proof`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const json = await response.json();
  return json.data.path;
}
