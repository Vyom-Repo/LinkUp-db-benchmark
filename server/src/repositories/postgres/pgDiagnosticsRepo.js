const { query } = require('../../config/postgres');

class PgDiagnosticsRepo {
  async explainQuery(sql, params = []) {
    const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
    const start = performance.now();
    const res = await query(explainSql, params);
    const duration = performance.now() - start;

    const planData = res.rows[0]['QUERY PLAN'][0];
    const plan = planData.Plan;

    // Helper to traverse plan nodes and sum buffer usage
    let sharedHitBlocks = 0;
    let sharedReadBlocks = 0;

    const traverse = (node) => {
      if (!node) return;
      if (node['Shared Hit Blocks']) sharedHitBlocks += node['Shared Hit Blocks'];
      if (node['Shared Read Blocks']) sharedReadBlocks += node['Shared Read Blocks'];
      if (node.Plans && Array.isArray(node.Plans)) {
        node.Plans.forEach(traverse);
      }
    };
    traverse(plan);

    return {
      engine: 'postgres',
      totalDurationMs: parseFloat(duration.toFixed(3)),
      planningTimeMs: planData['Planning Time'] || null,
      executionTimeMs: planData['Execution Time'] || null,
      sharedHitBlocks,
      sharedReadBlocks,
      primaryNodeType: plan['Node Type'],
      totalCost: plan['Total Cost'],
      actualRows: plan['Actual Rows'],
      rawPlan: planData,
    };
  }

  async getStorageStats() {
    const sql = `
      SELECT 
        table_name,
        pg_total_relation_size(quote_ident(table_name)) as total_bytes,
        pg_table_size(quote_ident(table_name)) as table_bytes,
        pg_indexes_size(quote_ident(table_name)) as index_bytes
      FROM (
        VALUES ('users'), ('posts'), ('comments'), ('post_likes')
      ) AS t(table_name);
    `;
    const res = await query(sql);

    let totalSizeBytes = 0;
    let totalTableBytes = 0;
    let totalIndexBytes = 0;

    const tables = res.rows.map((row) => {
      const tot = parseInt(row.total_bytes, 10);
      const tbl = parseInt(row.table_bytes, 10);
      const idx = parseInt(row.index_bytes, 10);
      totalSizeBytes += tot;
      totalTableBytes += tbl;
      totalIndexBytes += idx;

      return {
        table: row.table_name,
        totalBytes: tot,
        totalMB: parseFloat((tot / (1024 * 1024)).toFixed(3)),
        tableBytes: tbl,
        tableMB: parseFloat((tbl / (1024 * 1024)).toFixed(3)),
        indexBytes: idx,
        indexMB: parseFloat((idx / (1024 * 1024)).toFixed(3)),
      };
    });

    return {
      engine: 'postgres',
      totalSizeMB: parseFloat((totalSizeBytes / (1024 * 1024)).toFixed(3)),
      tableSizeMB: parseFloat((totalTableBytes / (1024 * 1024)).toFixed(3)),
      indexSizeMB: parseFloat((totalIndexBytes / (1024 * 1024)).toFixed(3)),
      tables,
    };
  }

  async toggleIndex({ target = 'posts_author', state = 'disable' } = {}) {
    if (target === 'posts_author') {
      if (state === 'disable') {
        await query('DROP INDEX IF EXISTS idx_posts_author_created;');
        return { index: 'idx_posts_author_created', status: 'dropped' };
      } else {
        await query('CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);');
        return { index: 'idx_posts_author_created', status: 'created' };
      }
    }
    throw new Error(`Unsupported index target: ${target}`);
  }
}

module.exports = new PgDiagnosticsRepo();
