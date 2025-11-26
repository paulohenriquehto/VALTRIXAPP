// AI Manager Edge Function - ValtrixApp
// Uses Groq API with llama-3.3-70b-versatile model
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SYSTEM_PROMPT, buildContextPrompt, DAILY_BRIEFING_PROMPT } from './prompts.ts';
import { AI_TOOLS } from './tools.ts';
import { aggregateContext, formatContextForPrompt } from './context.ts';
import { executeToolCall } from './tool-executor.ts';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  action?: 'chat' | 'daily_briefing' | 'generate_insights';
  stream?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's token for RLS
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: ChatRequest = await req.json();
    const { messages: userMessages, action = 'chat', stream = true } = body;

    // Aggregate context from database
    const context = await aggregateContext(supabaseClient, user.id);
    const contextPrompt = formatContextForPrompt(context);

    // Build messages array
    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: buildContextPrompt(contextPrompt) },
    ];

    // Add action-specific prompts
    if (action === 'daily_briefing') {
      messages.push({ role: 'user', content: DAILY_BRIEFING_PROMPT });
    } else {
      // Add user messages
      for (const msg of userMessages) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Initial API call
    let response = await callGroqAPI(groqApiKey, messages, stream);

    // Handle tool calls if present
    if (!stream && response.choices?.[0]?.message?.tool_calls) {
      const toolCalls = response.choices[0].message.tool_calls;

      // Add assistant message with tool calls
      messages.push({
        role: 'assistant',
        content: response.choices[0].message.content || '',
        tool_calls: toolCalls,
      });

      // Execute each tool call
      for (const toolCall of toolCalls) {
        const result = await executeToolCall(supabaseClient, user.id, toolCall);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Get final response after tool execution
      response = await callGroqAPI(groqApiKey, messages, false);
    }

    if (stream) {
      // Return streaming response
      return response;
    }

    // Save conversation to database
    await saveConversation(supabaseClient, user.id, userMessages, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Manager error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function callGroqAPI(
  apiKey: string,
  messages: Message[],
  stream: boolean
): Promise<Response | Record<string, unknown>> {
  const requestBody = {
    model: MODEL,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.tool_calls && { tool_calls: m.tool_calls }),
      ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
    })),
    tools: AI_TOOLS,
    tool_choice: 'auto',
    temperature: 0.7,
    max_tokens: 2048,
    stream,
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', errorText);
    throw new Error(`Groq API error: ${response.status}`);
  }

  if (stream) {
    // Return streaming response with CORS headers
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  return await response.json();
}

async function saveConversation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userMessages: Array<{ role: string; content: string }>,
  response: Record<string, unknown>
): Promise<void> {
  try {
    // Create or get active conversation
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: userMessages[0]?.content?.substring(0, 100) || 'Nova conversa',
      })
      .select()
      .single();

    if (convError) {
      console.error('Failed to create conversation:', convError);
      return;
    }

    // Save messages
    const messagesToSave = [
      ...userMessages.map(m => ({
        conversation_id: conversation.id,
        role: m.role,
        content: m.content,
      })),
      {
        conversation_id: conversation.id,
        role: 'assistant',
        content: (response.choices as Array<{ message: { content: string } }>)?.[0]?.message?.content || '',
      },
    ];

    await supabase.from('ai_messages').insert(messagesToSave);
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}
