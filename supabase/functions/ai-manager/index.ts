// AI Manager Edge Function - ValtrixApp
// Uses Google Gemini API with gemini-1.5-flash model
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SYSTEM_PROMPT, buildContextPrompt, DAILY_BRIEFING_PROMPT } from './prompts.ts';
import { AI_TOOLS } from './tools.ts';
import { aggregateContext, formatContextForPrompt } from './context.ts';
import { executeToolCall } from './tool-executor.ts';

// Gemini API URLs - Using gemini-2.5-flash (latest stable)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_STREAM_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';

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

interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string } | { functionCall: { name: string; args: Record<string, unknown> } } | { functionResponse: { name: string; response: unknown } }>;
}

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  action?: 'chat' | 'daily_briefing' | 'generate_insights';
  stream?: boolean;
}

// Convert OpenAI-style tools to Gemini function declarations
function convertToolsToGemini(tools: typeof AI_TOOLS) {
  return tools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters,
  }));
}

// Convert messages to Gemini format
function convertMessagesToGemini(messages: Message[]): { contents: GeminiContent[]; systemInstruction: string } {
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push(msg.content);
    } else if (msg.role === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: msg.content }],
      });
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Assistant with tool calls
        const parts: GeminiContent['parts'] = [];
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        for (const tc of msg.tool_calls) {
          parts.push({
            functionCall: {
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments),
            },
          });
        }
        contents.push({ role: 'model', parts });
      } else {
        contents.push({
          role: 'model',
          parts: [{ text: msg.content }],
        });
      }
    } else if (msg.role === 'tool') {
      // Tool response - find the corresponding tool call
      const toolName = findToolNameById(messages, msg.tool_call_id);
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: toolName || 'unknown',
            response: JSON.parse(msg.content),
          },
        }],
      });
    }
  }

  return {
    contents,
    systemInstruction: systemParts.join('\n\n'),
  };
}

function findToolNameById(messages: Message[], toolCallId?: string): string | null {
  if (!toolCallId) return null;
  for (const msg of messages) {
    if (msg.tool_calls) {
      const tc = msg.tool_calls.find(t => t.id === toolCallId);
      if (tc) return tc.function.name;
    }
  }
  return null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get API key from environment
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
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

    // Create Supabase client with service role
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
    let response = await callGeminiAPI(googleApiKey, messages, stream);

    if (stream) {
      // Return streaming response
      return response as Response;
    }

    // Handle non-streaming response
    const jsonResponse = response as GeminiResponse;

    // Check for function calls
    const candidate = jsonResponse.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter(
      (p): p is { functionCall: { name: string; args: Record<string, unknown> } } => 'functionCall' in p
    );

    if (functionCalls && functionCalls.length > 0) {
      // Add assistant message with tool calls
      const toolCalls = functionCalls.map((fc, index) => ({
        id: `call_${Date.now()}_${index}`,
        type: 'function' as const,
        function: {
          name: fc.functionCall.name,
          arguments: JSON.stringify(fc.functionCall.args),
        },
      }));

      const textPart = candidate.content.parts.find(
        (p): p is { text: string } => 'text' in p
      );

      messages.push({
        role: 'assistant',
        content: textPart?.text || '',
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
      response = await callGeminiAPI(googleApiKey, messages, false);
    }

    // Convert Gemini response to OpenAI-compatible format for frontend
    const geminiResponse = response as GeminiResponse;
    const openAIResponse = convertGeminiToOpenAI(geminiResponse);

    // Save conversation to database
    await saveConversation(supabaseClient, user.id, userMessages, openAIResponse);

    return new Response(JSON.stringify(openAIResponse), {
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

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text?: string; functionCall?: { name: string; args: Record<string, unknown> } }>;
      role: string;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

async function callGeminiAPI(
  apiKey: string,
  messages: Message[],
  stream: boolean
): Promise<Response | GeminiResponse> {
  const { contents, systemInstruction } = convertMessagesToGemini(messages);

  const requestBody = {
    contents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    tools: [{ functionDeclarations: convertToolsToGemini(AI_TOOLS) }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const url = stream
    ? `${GEMINI_STREAM_URL}?key=${apiKey}&alt=sse`
    : `${GEMINI_API_URL}?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  if (stream) {
    // Transform Gemini streaming format to OpenAI-compatible format
    const transformedStream = transformGeminiStream(response.body!);
    return new Response(transformedStream, {
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

// Transform Gemini SSE stream to OpenAI-compatible format
function transformGeminiStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();

        if (done) {
          // Send final done message
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            try {
              const geminiData = JSON.parse(jsonStr);
              const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

              if (text) {
                // Convert to OpenAI format
                const openAIChunk = {
                  id: `chatcmpl-${Date.now()}`,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: 'gemini-2.5-flash',
                  choices: [{
                    index: 0,
                    delta: { content: text },
                    finish_reason: null,
                  }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
              }

              // Check for finish reason
              if (geminiData.candidates?.[0]?.finishReason === 'STOP') {
                const finishChunk = {
                  id: `chatcmpl-${Date.now()}`,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: 'gemini-2.5-flash',
                  choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: 'stop',
                  }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

// Convert Gemini response to OpenAI-compatible format
function convertGeminiToOpenAI(geminiResponse: GeminiResponse): Record<string, unknown> {
  const candidate = geminiResponse.candidates?.[0];
  const textPart = candidate?.content?.parts?.find(
    (p): p is { text: string } => 'text' in p && typeof p.text === 'string'
  );

  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gemini-2.5-flash',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: textPart?.text || '',
      },
      finish_reason: candidate?.finishReason === 'STOP' ? 'stop' : 'length',
    }],
    usage: {
      prompt_tokens: geminiResponse.usageMetadata?.promptTokenCount || 0,
      completion_tokens: geminiResponse.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: geminiResponse.usageMetadata?.totalTokenCount || 0,
    },
  };
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
