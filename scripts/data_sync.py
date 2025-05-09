from pymongo import MongoClient
import psycopg2
from scripts.orbisdb_client import OrbisDBClient

class DataSynchronizer:
    def __init__(self):
        self.mongodb_client = MongoClient('mongodb://localhost:27017/')
        self.pg_connection = psycopg2.connect(
            dbname='your_dbname', 
            user='your_user', 
            password='your_password', 
            host='localhost'
        )
        self.orbisdb_client = OrbisDBClient()

    def sync_to_orbisdb(self, collection_name, record_id):
        db = self.mongodb_client['your_database']
        collection = db[collection_name]
        document = collection.find_one({'_id': record_id})
        
        if document:
            orbis_response = self.orbisdb_client.store_data(document)
            print(f'OrbisDB Response: {orbis_response}')
        else:
            print('Document not found in MongoDB')

    def sync_from_orbisdb(self, record_id):
        orbis_response = self.orbisdb_client.get_data(record_id)
        
        if orbis_response['success']:
            data = orbis_response['data']
            # Insert or update the data in your PostgreSQL database
            with self.pg_connection.cursor() as cursor:
                cursor.execute("INSERT INTO your_table (id, data) VALUES (%s, %s) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data", (record_id, data))
                self.pg_connection.commit()
            print('Data synchronized from OrbisDB to PostgreSQL')
        else:
            print('Failed to retrieve data from OrbisDB')