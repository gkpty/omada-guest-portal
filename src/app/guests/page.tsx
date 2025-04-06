// app/admin/guests/page.tsx

import { documentClient } from '@/dynamoClient';
import { ScanCommand } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = 'mansa-wifi-guests';

export default async function GuestListPage() {

  const response = await documentClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  const guests = response.Items || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Wi-Fi Guest Submissions</h1>

      {guests.length === 0 ? (
        <p>No guests found.</p>
      ) : (
        <table className="w-full text-sm border border-gray-300 rounded-md overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Phone</th>
              <th className="text-left px-4 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((item, i) => (
              <tr
                key={item.id?.S ?? i}
                className="border-t border-gray-200 even:bg-gray-50"
              >
                <td className="px-4 py-2">{item.name?.S || '—'}</td>
                <td className="px-4 py-2">{item.email?.S || '—'}</td>
                <td className="px-4 py-2">{item.phone?.S || '—'}</td>
                <td className="px-4 py-2">
                  {item.timestamp?.S
                    ? new Date(item.timestamp.S).toLocaleString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
