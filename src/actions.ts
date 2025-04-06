'use server';

import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { documentClient } from './dynamoClient';

const TABLE_NAME = 'mansa-wifi-guests';
const OMADA_CONTROLLER_URL = process.env.OMADA_CONTROLLER_URL!;

interface SubmitFormData {
  name: string;
  contact: string;
  clientMac: string;
  apMac: string;
  redirectUrl?: string;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string) {
  const cleaned = value.replace(/[^\d]/g, '');
  const validFormat = /^[\d\s()+-]+$/.test(value);
  return validFormat && cleaned.length >= 5 && cleaned.length <= 15;
}

export async function submitForm({
  name,
  contact,
  clientMac,
  apMac,
  redirectUrl,
}: SubmitFormData) {
  if (!name || !contact) {
    throw new Error('Missing required fields.');
  }

  const id = uuidv4();
  const timestamp = new Date().toISOString();

  const item: Record<string, { S: string }> = {
    id: { S: id },
    name: { S: name },
    clientMac: { S: clientMac },
    apMac: { S: apMac },
    timestamp: { S: timestamp },
  };

  if (isEmail(contact)) {
    item.email = { S: contact.trim() };
  } else if (isPhone(contact)) {
    const normalizedPhone = contact.replace(/[^\d]/g, '');
    item.phone = { S: contact.trim() };
    item.phoneNormalized = { S: normalizedPhone };
  } else {
    throw new Error('Invalid email or phone format.');
  }

  await documentClient.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  // ✅ Build Omada token by just concatenating MACs (no colons)
  const clientPart = clientMac.replace(/:/g, '');
  const apPart = apMac.replace(/:/g, '');
  const token = `${clientPart}${apPart}`;

  // ✅ Redirect to Omada controller's /portal/auth with the token
  const omadaRedirect = `${OMADA_CONTROLLER_URL}/portal/auth?token=${token}`;
  console.log('Redirecting to:', omadaRedirect);

  redirect(redirectUrl || omadaRedirect);
}
