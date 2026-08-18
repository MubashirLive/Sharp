#!/usr/bin/env node
// Simple MCP stdio client to demonstrate Supabase MCP server capabilities
import { spawn } from 'node:child_process';

const ACCESS_TOKEN = 'sb_secret_HrrD5qf30gCZ5CeCUtHAGw_GdHiade9';
const PROJECT_REF = 'ndtqhschvnyloeccaelv';

const child = spawn('npx', [
  '-y', '@supabase/mcp-server-supabase',
  `--access-token=${ACCESS_TOKEN}`,
  `--project-ref=${PROJECT_REF}`,
], { shell: true });

let buffer = '';

child.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const msg = JSON.parse(trimmed);
      handleMessage(msg);
    } catch {
      // ignore non-JSON lines
    }
  }
});

child.stderr.on('data', (data) => {
  // Suppress spinner noise
});

child.on('close', (code) => {
  process.exit(code || 0);
});

function send(msg) {
  child.stdin.write(JSON.stringify(msg) + '\n');
}

function handleMessage(msg) {
  if (msg.id === 1) {
    console.log('\n=== MCP Server Initialized ===');
    console.log(`Server: ${msg.result.serverInfo.name} v${msg.result.serverInfo.version}`);
    console.log(`Protocol: ${msg.result.protocolVersion}`);
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  } else if (msg.id === 2) {
    console.log(`\n=== Available Tools (${msg.result.tools.length}) ===`);
    for (const tool of msg.result.tools) {
      console.log(`  - ${tool.name}: ${tool.description?.split('\n')[0] || ''}`);
    }
    console.log('\n=== Demonstrating: search_docs ===');
    // Query with totalCount and nodes to show search works
    const searchQuery = `query {
      searchDocs(query: "Row Level Security") {
        totalCount
        nodes { __typename }
      }
    }`;
    send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_docs',
        arguments: { graphql_query: searchQuery }
      }
    });
  } else if (msg.id === 3) {
    console.log('\n=== search_docs Result ===');
    if (msg.result?.content) {
      for (const item of msg.result.content) {
        if (item.type === 'text') {
          const text = item.text;
          try {
            const parsed = JSON.parse(text);
            console.log(JSON.stringify(parsed, null, 2).slice(0, 5000));
          } catch {
            console.log(text.slice(0, 5000));
          }
        }
      }
    } else {
      console.log(JSON.stringify(msg, null, 2).slice(0, 5000));
    }
    child.kill();
    process.exit(0);
  }
}

send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'demo-client', version: '1.0.0' }
  }
});

setTimeout(() => {
  console.error('Timeout - exiting');
  child.kill();
  process.exit(1);
}, 30000);