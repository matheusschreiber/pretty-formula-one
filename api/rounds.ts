import { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await client.connect();
        const database = client.db('prettyf1');
        const rounds = database.collection('rounds');
        const { year } = req.query;

        if (year) {
            const data = await rounds.find({ year: Number(year) }).toArray();
            if (!data) {
                return res.status(404).json({ error: 'Round not found' });
            }
            return res.status(200).json(data);
        } else {
            return res.status(200).json([]);
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
}