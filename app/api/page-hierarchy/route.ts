import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/db";
import { buildHierarchyFromPages, PageData } from "@/lib/page-hierarchy-service";

/**
 * GET: Obtiene todas las páginas y las devuelve en formato jerárquico
 * para ser utilizadas por el componente PageHierarchyNavigation
 */
export async function GET() {
  try {
    // Consultar todas las páginas con los campos esenciales para la estructura jerárquica
    const result = await db.query(`
      SELECT id, title, slug, parent_id, level, content
      FROM pages
      ORDER BY level ASC, id ASC
    `);

    // Transformar los datos en el formato esperado
    const pages: PageData[] = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      parent_id: row.parent_id,
      level: row.level,
      content: row.content ? JSON.parse(row.content) : null
    }));

    // Construir la jerarquía de páginas
    const hierarchy = buildHierarchyFromPages(pages);

    return NextResponse.json(hierarchy, { status: 200 });
  } catch (err) {
    console.error("[API] GET /api/page-hierarchy error:", err);
    return NextResponse.json({ error: "Error al obtener la jerarquía de páginas" }, { status: 500 });
  }
}