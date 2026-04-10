import Anthropic from '@anthropic-ai/sdk';
import { getClient } from '@/lib/storage';
import { PERSONALITY_DESCRIPTIONS } from '@/lib/constants';
import { ChatRequest } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const anthropic = new Anthropic();

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { clientId, message, history } = body;

    const client = getClient(clientId);

    // Build system prompt even if client not found server-side (localStorage is client-only)
    // We'll use the history to infer context
    let systemPrompt: string;

    if (client) {
      const orderInfo = client.order.leadsPerMonth
        ? `Current order: ${client.order.leadsPerMonth} leads/month at ${formatCurrency(client.order.costPerLead || 0)}/lead (${formatCurrency(client.order.monthlyBudget || 0)}/month) for ${client.order.practiceArea}.`
        : `No active order yet. Interested in ${client.order.practiceArea} leads.`;

      systemPrompt = `You are roleplaying as ${client.contactName}, ${client.firmName === client.contactName ? 'a lawyer' : `a partner at ${client.firmName}`}, a law firm that buys legal leads.

${PERSONALITY_DESCRIPTIONS[client.personality]}

${orderInfo}
${client.order.notes ? `Context: ${client.order.notes}` : ''}

You are speaking with a lead broker sales rep from Blackstone Legal Network. Stay in character. Keep responses to 2-4 sentences. Be natural and conversational. Never break character or mention you are an AI. IMPORTANT: Always end your response with a question or a statement that invites a reply — keep the conversation going.`;
    } else {
      // Fallback: use info from conversation context
      systemPrompt = `You are roleplaying as a law firm partner who buys legal leads from Blackstone Legal Network. Keep responses to 2-4 sentences. Be natural and conversational. Never break character or mention you are an AI. IMPORTANT: Always end your response with a question or a statement that invites a reply — keep the conversation going.`;
    }

    const messages = history.map((msg) => ({
      role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
    }));

    // Add the latest message if not already in history
    if (
      messages.length === 0 ||
      messages[messages.length - 1].content !== message
    ) {
      messages.push({ role: 'user', content: message });
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: systemPrompt,
      messages,
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return Response.json({ response: text });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
