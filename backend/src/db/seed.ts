import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { services } from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  const initialServices = [
    { name: 'Extensão de cílios volume brasileiro', durationMinutes: 120, price: 100.0 },
    { name: 'Extensão de cílios volume egípcio', durationMinutes: 150, price: 120.0 },
    { name: 'Design de sobrancelha com henna', durationMinutes: 60, price: 40.0 },
    { name: 'Design de sobrancelha simples', durationMinutes: 40, price: 25.0 },
    { name: 'Combo: volume brasileiro + sobrancelha com henna', durationMinutes: 180, price: 130.0 },
    { name: 'Combo: volume brasileiro + sobrancelha simples', durationMinutes: 150, price: 115.0 },
    { name: 'Combo: volume egípcio + sobrancelha com henna', durationMinutes: 210, price: 150.0 },
    { name: 'Combo: volume egípcio + sobrancelha simples', durationMinutes: 180, price: 135.0 },
  ];

  for (const s of initialServices) {
    await db.insert(services).values(s);
  }
  
  console.log('✅ Seed do Drizzle concluído com sucesso!');
  await client.end();
}

main().catch(console.error);
