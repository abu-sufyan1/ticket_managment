import 'dotenv/config';
import { app } from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
