import React, { useState, useEffect } from 'react';

export function TestConnection() {
  const [status, setStatus] = useState<string>('Checking connection...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        const response = await fetch('http://localhost:5000/api/workdiary/test');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStatus(JSON.stringify(data, null, 2));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to backend');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Backend Connection Test</h2>
      {error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <pre className="bg-gray-100 p-4 rounded">{status}</pre>
      )}
    </div>
  );
}
