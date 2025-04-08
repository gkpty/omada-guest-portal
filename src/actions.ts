'use server';

import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { documentClient } from './dynamoClient';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const TABLE_NAME = 'mansa-wifi-guests';

const OMADA_BASE_URL = process.env.OMADA_CONTROLLER_URL!; // e.g. https://24.144.83.81:8043/a4d3107367bfe1c7133895cd766b1333
const OMADA_OPERATOR_USER = process.env.OMADA_OPERATOR_USER!;
const OMADA_OPERATOR_PASS = process.env.OMADA_OPERATOR_PASS!;
const OMADA_CONTROLLER_ID = process.env.OMADA_CONTROLLER_ID!;
//const OMADA_SITE_NAME = 'mansa';
const AUTH_DURATION_MS = 3600000;

interface SubmitFormData {
    name: string;
    contact: string;
    clientMac: string;
    apMac: string;
    redirectUrl?: string;
    ssidName?: string | undefined;
    radioId?: string | undefined;
    site?: string | undefined;
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
    ssidName,
    radioId,
    site
}: SubmitFormData) {
    if (!name || !contact) {
        throw new Error('Missing required fields.');
    }

    console.log('Form data:', { 
        name, 
        contact, 
        clientMac, 
        apMac, 
        redirectUrl, 
        ssidName,
        radioId,
        site
    });

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

    console.log('Guest saved to DynamoDB:', item);

    const jar = new CookieJar();
    const client = wrapper(
        axios.create({
            jar,
            withCredentials: true,
        })
    );

    // 1. Login to Omada Controller
    const loginRes = await client.post(
        `${OMADA_BASE_URL}/${OMADA_CONTROLLER_ID}/api/v2/hotspot/login`,
        {
            name: OMADA_OPERATOR_USER,
            password: OMADA_OPERATOR_PASS,
        },
        { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('Login response:', loginRes);

    const csrfToken = loginRes.data?.result?.token;
    if (!csrfToken) throw new Error('No CSRF token returned');

    // Step 2: Authorize client
    const authRes = await client.post(
        `${OMADA_BASE_URL}/${OMADA_CONTROLLER_ID}/api/v2/hotspot/extPortal/auth`,
        {
            clientMac,
            apMac,
            ssidName,
            radioId: radioId || '',
            time: AUTH_DURATION_MS,
            authType: 4,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Csrf-Token': csrfToken,
            }
        }
    );

    console.log('Auth Result:', authRes.data);


    // 3. Redirect to the next page (Google or custom)
    redirect(redirectUrl || 'https://mansafurniture.com');
}
