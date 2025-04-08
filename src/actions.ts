'use server';

import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { documentClient } from './dynamoClient';

const TABLE_NAME = 'mansa-wifi-guests';

const OMADA_BASE_URL = process.env.OMADA_CONTROLLER_URL!; // e.g. https://24.144.83.81:8043/a4d3107367bfe1c7133895cd766b1333
const OMADA_OPERATOR_USER = process.env.OMADA_OPERATOR_USER!;
const OMADA_OPERATOR_PASS = process.env.OMADA_OPERATOR_PASS!;
const OMADA_CONTROLLER_SSID = process.env.OMADA_CONTROLLER_SSID!; // e.g. Mansa WiFi
const AUTH_DURATION_MS = 3600000;

interface SubmitFormData {
  name: string;
  contact: string;
  clientMac: string;
  apMac: string;
  redirectUrl?: string;
  ssid?: string | undefined;
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
  ssid
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

  // Save guest to DynamoDB
  await documentClient.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  // 1. Login to Omada Controller
  const loginRes = await fetch(`${OMADA_BASE_URL}/api/v2/hotspot/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: OMADA_OPERATOR_USER,
      password: OMADA_OPERATOR_PASS,
    }),
  });

  if (!loginRes.ok) {
    console.error(await loginRes.text());
    throw new Error('Failed to authenticate with Omada controller');
  }

  const loginData = await loginRes.json();
  const csrfToken = loginData?.result?.token;
  if (!csrfToken) {
    throw new Error('Omada CSRF token not found');
  }

  // 2. Authorize client MAC
  const authRes = await fetch(`${OMADA_BASE_URL}/api/v2/hotspot/extPortal/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Csrf-Token': csrfToken,
    },
    body: JSON.stringify({
      clientMac,
      apMac,
      ssidName: ssid || '', // Optional: can be passed from frontend if needed
      radioId: '',  // Optional: can be passed from frontend if needed
      authType: 4,
      time: AUTH_DURATION_MS,
    }),
  });

  const authData = await authRes.json();
  if (authData?.errorCode !== '0') {
    console.error(authData);
    throw new Error('Failed to authorize client on the WiFi network');
  }

  // 3. Redirect to the next page (Google or custom)
  redirect(redirectUrl || 'https://mansafurniture.com');
}
