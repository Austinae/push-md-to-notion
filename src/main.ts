import * as core from '@actions/core';
import * as github from '@actions/github';

import { actionStore } from './actionCtx';
import { NotionApi } from './notion';
import { pushUpdatedMarkdownFiles } from './pushMarkdown';

async function main() {
  try {
    console.log('[main] Starting GitHub Action');
    const token = core.getInput('notion-token');
    console.log(`[main] Notion token provided: ${token ? 'Yes' : 'No'}`);
    
    github.context.repo.repo;
    const notion = new NotionApi(token);
    console.log('[main] NotionApi client created');

    console.log('[main] Starting to push updated markdown files');
    await actionStore.run({ notion }, pushUpdatedMarkdownFiles);
    console.log('[main] Successfully completed pushing markdown files');
  } catch (e) {
    console.error('[main] Error occurred:', e);
    core.setFailed(e instanceof Error ? e.message : 'Unknown reason');
  }
}

main();
