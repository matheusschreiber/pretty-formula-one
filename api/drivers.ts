import { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        await client.connect();
        const database = client.db('prettyf1');
        const drivers = database.collection('drivers');
        const data = await drivers.find({}).toArray();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
}