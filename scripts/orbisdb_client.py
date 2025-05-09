from dotenv import load_dotenv
import requests

load_dotenv()

class OrbisDBClient:
    def __init__(self):
        self.api_url = os.getenv('ORBISDB_API_URL')
        self.api_key = os.getenv('ORBISDB_API_KEY')
        self.chain_id = os.getenv('ORBISDB_CHAIN_ID')
        self.contract_address = os.getenv('ORBISDB_CONTRACT_ADDRESS')

    def store_data(self, data):
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        payload = {
            'chainId': self.chain_id,
            'contractAddress': self.contract_address,
            'data': data
        }
        response = requests.post(f'{self.api_url}/store', headers=headers, json=payload)
        return response.json()

    def get_data(self, record_id):
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        response = requests.get(f'{self.api_url}/data/{record_id}', headers=headers)
        return response.json()