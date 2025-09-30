import { Client } from '@notionhq/client';
import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';
import { markdownToBlocks } from '@tryfabric/martian';

/**
 * Class for managing Notion client state and methods needed for the action.
 */
export class NotionApi {
  private client: Client;
  constructor(token: string) {
    this.client = new Client({
      auth: token,
    });
  }

  public async updatePageTitle(pageId: string, title: string) {
    console.log(`[updatePageTitle] Updating page ${pageId} with title: "${title}"`);
    
    try {
      await this.client.pages.update({
        page_id: pageId,
        properties: {
          title: {
            type: 'title',
            title: [
              {
                type: 'text',
                text: { content: title },
              },
            ],
          },
        },
      });
      console.log(`[updatePageTitle] Successfully updated page title`);
    } catch (error) {
      console.error(`[updatePageTitle] Failed to update page title:`, error);
      throw error;
    }
  }

  public async clearBlockChildren(blockId: string) {
    console.log(`[clearBlockChildren] Starting to clear children for blockId: ${blockId}`);
    let deletedCount = 0;
    
    for await (const block of this.listChildBlocks(blockId)) {
      console.log(`[clearBlockChildren] Deleting block ${block.id} (type: ${'type' in block ? block.type : 'unknown'})`);
      await this.client.blocks.delete({
        block_id: block.id,
      });
      deletedCount++;
    }
    
    console.log(`[clearBlockChildren] Completed - deleted ${deletedCount} blocks`);
  }

  /**
   * Convert markdown to the notion block data format and append it to an existing block.
   * @param blockId Block which the markdown elements will be appended to.
   * @param md Markdown as string.
   */
  public async appendMarkdown(
    blockId: string,
    md: string,
    preamble: BlockObjectRequest[] = []
  ) {
    console.log(`[appendMarkdown] Starting with blockId: ${blockId}`);
    console.log(`[appendMarkdown] Preamble blocks count: ${preamble.length}`);
    console.log(`[appendMarkdown] Markdown length: ${md.length} characters`);
    
    const markdownBlocks = markdownToBlocks(md) as BlockObjectRequest[];
    console.log(`[appendMarkdown] Markdown converted to ${markdownBlocks.length} blocks`);
    
    const allBlocks = [...preamble, ...markdownBlocks];
    console.log(`[appendMarkdown] Total blocks to append: ${allBlocks.length}`);
    
    const batchSize = 100;
    console.log(`[appendMarkdown] Batch size: ${batchSize}`);
    
    // Process blocks in batches of 100 to respect Notion's API limit
    for (let i = 0; i < allBlocks.length; i += batchSize) {
      const batch = allBlocks.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(allBlocks.length / batchSize);
      
      console.log(`[appendMarkdown] Processing batch ${batchNumber}/${totalBatches} with ${batch.length} blocks (blocks ${i + 1}-${Math.min(i + batchSize, allBlocks.length)})`);
      
      // Log the first few blocks in the batch to help debug URL issues
      if (batchNumber === 1) {
        console.log(`[appendMarkdown] First batch block types:`, batch.slice(0, 3).map(b => ({ type: b.type, hasContent: !!b[b.type as keyof typeof b] })));
      }
      
      try {
        await this.client.blocks.children.append({
          block_id: blockId,
          children: batch,
        });
        console.log(`[appendMarkdown] Successfully appended batch ${batchNumber}/${totalBatches}`);
      } catch (error) {
        console.error(`[appendMarkdown] Failed to append batch ${batchNumber}/${totalBatches}:`, error);
        console.error(`[appendMarkdown] Batch content (first 2 blocks):`, JSON.stringify(batch.slice(0, 2), null, 2));
        throw error;
      }
    }
    
    console.log(`[appendMarkdown] Completed successfully - appended ${allBlocks.length} blocks in ${Math.ceil(allBlocks.length / batchSize)} batches`);
  }

  /**
   * Iterate over all of the childeren of a given block. This manages the underlying paginated API.
   * @param blockId Block being listed.
   * @param batchSize Number of childeren to fetch in each call to notion. Max 100.
   */
  public async *listChildBlocks(blockId: string, batchSize = 50) {
    let has_more = true;
    do {
      const blocks = await this.client.blocks.children.list({
        block_id: blockId,
        page_size: batchSize,
      });

      for (const block of blocks.results) {
        yield block;
      }

      has_more = blocks.has_more;
    } while (has_more);
  }
}

export interface NotionFrontmatter {
  notion_page: string;
  title?: string;
  [key: string]: unknown;
}

export function isNotionFrontmatter(fm: unknown): fm is NotionFrontmatter {
  const castFm = fm as NotionFrontmatter;
  return (
    typeof castFm?.notion_page === 'string' &&
    (typeof castFm?.title === 'string' || typeof castFm?.title === 'undefined')
  );
}
