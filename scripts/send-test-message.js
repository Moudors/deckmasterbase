// scripts/send-test-message.js
// Envia uma mensagem de teste para um usuário específico
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendTestMessage(recipient_id, sender_id, sender_name) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      recipient_id,
      sender_id,
      sender_name,
      content: 'Mensagem de teste gerada pelo script',
      type: 'test',
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao enviar mensagem de teste:', error);
  } else {
    console.log('Mensagem de teste enviada:', data);
  }
}

// Exemplo de uso: node scripts/send-test-message.js <recipient_id> <sender_id> <sender_name>
if (require.main === module) {
  const [recipient_id, sender_id, sender_name] = process.argv.slice(2);
  if (!recipient_id || !sender_id || !sender_name) {
    console.error('Uso: node scripts/send-test-message.js <recipient_id> <sender_id> <sender_name>');
    process.exit(1);
  }
  sendTestMessage(recipient_id, sender_id, sender_name);
}
