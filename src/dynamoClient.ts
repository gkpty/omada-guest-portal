import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const dynamoDbConfig = process.env.NODE_ENV === 'production' ? {
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
} : {
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',  // If running DynamoDB locally with Docker
  maxAttempts: 5,                    // Retry up to 5 times before failing
  credentials: {
    accessKeyId: 'dummy',  // Use dummy credentials for local testing
    secretAccessKey: 'dummy',
  },
} as DynamoDBClientConfig;

// Create DynamoDB client
const dynamoDBClient = new DynamoDBClient(dynamoDbConfig);

// Create DynamoDB Document Client
const documentClient = DynamoDBDocumentClient.from(dynamoDBClient);

export { documentClient };


