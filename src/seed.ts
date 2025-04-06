// Function to create the Warehouse table

import { CreateTableInput, CreateTableCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb';
import { documentClient } from './dynamoClient';

export const deleteTables = async () => {
  for (const tableName of ["mansa-wifi-guests"]) {
    const params = {
      TableName: tableName,
    };
    try {
      await documentClient.send(new DeleteTableCommand(params));
      console.log("Table deleted successfully");
    } catch (error) {
      console.error("Error deleting table:", error);
    }
  }
}

export const createWarehouseTable = async() => {
    const params = {
      TableName: 'mansa-wifi-guests',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'name', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: 'NameIndex',
          KeySchema: [
            { AttributeName: 'name', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
    } as CreateTableInput;

    const data = await documentClient.send(new CreateTableCommand(params));
    console.log('Warehouse Table created successfully:', data);
   
  }
  
createWarehouseTable();