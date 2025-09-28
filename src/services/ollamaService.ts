import axios from 'axios';

const OLLAMA_BASE_URL = 'http://localhost:11434';

export class OllamaService {
  async generateSQL(query: string): Promise<string> {
    const prompt = `Convert to SQL for SQLite database:

Tables:
- cheques: id, cheque_number, amount, client_name, status, issue_date, date_field, created_at
- documents: id, file_name, created_at

Query: "${query}"

Return ONLY SQL, no explanations:`;

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: 'phi3:mini',
      prompt,
      stream: false
    });

    return response.data.response.trim();
  }
}