import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db"; 

/**
 * GET: Retrieve all pages with their hierarchical structure
 * Returns pages sorted by level and ID for proper tree building
 */
export async function GET() {
  try {
    // Query all pages with essential fields for tree structure
    const result = await db.query(`
      SELECT id, title, slug, parent_id, level, content, created_at
      FROM pages
      ORDER BY level ASC, id ASC
    `);

    // Parse JSON content for each page, with fallback for invalid JSON
    const pages = result.rows.map((row: any) => {
      let parsedContent;
      try {
        parsedContent = row.content ? JSON.parse(row.content) : { type: 'doc', content: [] };
      } catch {
        parsedContent = row.content || { type: 'doc', content: [] };
      }
      return {
        ...row,
        content: parsedContent,
      };
    });

    return NextResponse.json(pages, { status: 200 });
  } catch (err) {
    console.error("[API] GET /api/pages error:", err);
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

/**
 * POST: Create a new page in the hierarchy
 * @param req Request containing page data (title, slug, parent_id, level, content)
 * @returns Newly created page data
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.query(
      `INSERT INTO pages (title, slug, parent_id, level, content) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.title, data.slug, data.parent_id, data.level, JSON.stringify(data.content)]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("[API] POST /api/pages error:", err);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}

/**
 * PUT: Update an existing page
 * @param req Request containing updated page data
 * @returns Updated page data or error if page not found
 */
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.query(
      `UPDATE pages SET title = $1, slug = $2, parent_id = $3, level = $4, content = $5 WHERE id = $6 RETURNING *`,
      [data.title, data.slug, data.parent_id, data.level, JSON.stringify(data.content), data.id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("[API] PUT /api/pages error:", err);
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

/**
 * DELETE: Remove a page from the hierarchy
 * @param req Request containing the page ID to delete
 * @returns Success status or error message
 */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await db.query(`DELETE FROM pages WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] DELETE /api/pages error:", err);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
