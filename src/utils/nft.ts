import axios from 'axios';

export async function uploadMetadataToIPFS(metadata: object, pinataApiKey: string, pinataSecret: string): Promise<string> {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const response = await axios.post(url, metadata, {
    headers: { 
      'pinata_api_key': pinataApiKey, 
      'pinata_secret_api_key': pinataSecret 
    }
  });
  return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
}