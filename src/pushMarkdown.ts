import pfs from 'node:fs/promises';
import path from 'node:path';

import * as core from '@actions/core';
import * as github from '@actions/github';
import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';
import { markdownToRichText } from '@tryfabric/martian';
import graymatter from 'gray-matter';

import { getCtx } from './actionCtx';
import { getChangedMdFiles } from './git';
import { isNotionFrontmatter } from './notion';
import { retry, RetryError } from './retry';

export async function pushUpdatedMarkdownFiles() {
  console.log('[pushUpdatedMarkdownFiles] Starting to process changed markdown files');
  
  const markdownFiles = getChangedMdFiles();
  console.log(`[pushUpdatedMarkdownFiles] Found ${markdownFiles.length} changed markdown files:`, markdownFiles);
  
  const fileFailures: { file: string; message: string }[] = [];
  
  for (const mdFileName of markdownFiles) {
    console.log(`[pushUpdatedMarkdownFiles] Processing file: ${mdFileName}`);
    
    const res = await retry(() => pushMarkdownFile(mdFileName), {
      tries: 2,
    });

    if (res instanceof RetryError) {
      console.log('Failed to push markdown file', res);
      fileFailures.push({ file: mdFileName, message: res.message });
    } else {
      console.log(`[pushUpdatedMarkdownFiles] Successfully processed file: ${mdFileName}`);
    }
  }
  
  console.log(`[pushUpdatedMarkdownFiles] Completed processing. Failures: ${fileFailures.length}`);
  
  if (fileFailures.length) {
    console.error(`[pushUpdatedMarkdownFiles] Files failed to push:`, fileFailures);
    core.setFailed(`Files failed to push: ${fileFailures}`);
  }
}

export async function pushMarkdownFile(mdFilePath: string) {
  console.log(`[pushMarkdownFile] Starting to process file: ${mdFilePath}`);
  
  const { notion } = getCtx();
  const fileContents = await pfs.readFile(mdFilePath, { encoding: 'utf-8' });
  const fileMatter = graymatter(fileContents);

  console.log(`[pushMarkdownFile] File size: ${fileContents.length} characters`);
  console.log(`[pushMarkdownFile] Content length (after frontmatter): ${fileMatter.content.length} characters`);

  if (!isNotionFrontmatter(fileMatter.data)) {
    console.log(`[pushMarkdownFile] No Notion frontmatter found, skipping file`);
    return;
  }

  console.log('Notion frontmatter found', {
    frontmatter: fileMatter.data,
    file: mdFilePath,
  });

  const pageData = fileMatter.data;
  const pageId = pageData.notion_page.startsWith('http')
    ? path.basename(new URL(pageData.notion_page).pathname).split('-').at(-1)
    : pageData.notion_page;

  console.log(`[pushMarkdownFile] Extracted pageId: ${pageId}`);

  if (!pageId) {
    throw new Error('Could not get page ID from frontmatter');
  }

  if (pageData.title) {
    console.log(`Updating title: ${pageData.title}`);
    await notion.updatePageTitle(pageId, pageData.title);
  }

  console.log('Clearing page content');
  await notion.clearBlockChildren(pageId);

  console.log('Adding markdown content');
  const warningBlock = createWarningBlock(mdFilePath);
  console.log(`[pushMarkdownFile] Created warning block:`, warningBlock);
  
  await notion.appendMarkdown(pageId, fileMatter.content, [warningBlock]);
  
  console.log(`[pushMarkdownFile] Successfully completed processing file: ${mdFilePath}`);
}

function createWarningBlock(fileName: string): BlockObjectRequest {
  return {
    type: 'callout',
    callout: {
      rich_text: markdownToRichText(
        `This file is linked to Github. Changes must be made in the [markdown file](${github.context.payload.repository?.html_url}/blob/${github.context.sha}/${fileName}) to be permanent.`
      ),
      icon: {
        emoji: '⚠',
      },
      color: 'yellow_background',
    },
  };
}
