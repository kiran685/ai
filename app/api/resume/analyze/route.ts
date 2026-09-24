import { NextResponse } from "next/server";
import mammoth from "mammoth";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  data: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string }>;

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const career = formData.get("career");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No resume file uploaded." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Resume must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();

    if (
      !fileName.endsWith(".pdf") &&
      !fileName.endsWith(".docx")
    ) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";

    if (fileName.endsWith(".pdf")) {
      const result = await pdfParse(buffer);
      text = result.text;
    }

    if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({
        buffer,
      });

      text = result.value;
    }

    text = text.trim();

    if (!text) {
      return NextResponse.json(
        {
          error:
            "We could not extract readable text from this resume.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      career,
      fileName: file.name,
      text,
      characters: text.length,
    });
  } catch (error) {
    console.error("Resume processing error:", error);

    return NextResponse.json(
      {
        error: "Failed to process the resume.",
      },
      { status: 500 }
    );
  }
}