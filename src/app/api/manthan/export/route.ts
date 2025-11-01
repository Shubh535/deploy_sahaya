import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/utils/auth';

/**
 * POST /api/manthan/export
 * Generate a downloadable report of a journal entry with insights
 * Returns HTML formatted for PDF export
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const body = await request.json();
    const { journal, insights } = body;

    if (!journal) {
      return NextResponse.json(
        { error: 'Journal entry required' },
        { status: 400 }
      );
    }

    // Format date
    const date = journal.timestamp instanceof Date 
      ? journal.timestamp 
      : journal.timestamp?.toDate?.() || new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Mood emoji mapping
    const moodEmojis: { [key: string]: string } = {
      happy: '😊',
      calm: '😌',
      neutral: '😐',
      anxious: '😰',
      sad: '😢',
      angry: '😡',
    };

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Manthan Journal Export - ${journal.title || 'Untitled'}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #6366f1;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    h1 {
      color: #6366f1;
      font-size: 28px;
      margin: 10px 0;
    }
    .metadata {
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .mood {
      font-size: 32px;
      text-align: center;
      margin: 20px 0;
    }
    .tags {
      margin: 15px 0;
    }
    .tag {
      display: inline-block;
      background: #e0e7ff;
      color: #4f46e5;
      padding: 4px 12px;
      border-radius: 12px;
      margin-right: 8px;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .content {
      margin: 30px 0;
      padding: 20px;
      background: #ffffff;
      border-left: 4px solid #6366f1;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .insights {
      margin: 30px 0;
      padding: 20px;
      background: #f0fdf4;
      border-radius: 8px;
      border: 1px solid #86efac;
    }
    .insights h2 {
      color: #16a34a;
      margin-top: 0;
    }
    .insight-section {
      margin: 15px 0;
    }
    .insight-section h3 {
      color: #15803d;
      font-size: 16px;
      margin-bottom: 8px;
    }
    .insight-section p {
      margin: 5px 0;
      padding-left: 15px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🪔</div>
    <h1>Manthan Journal</h1>
    <p style="color: #6b7280;">A Journey of Self-Reflection</p>
  </div>

  <div class="metadata">
    <div>
      <strong>Date:</strong> ${formattedDate}
    </div>
    <div>
      <strong>Entry:</strong> ${journal.title || 'Untitled'}
    </div>
  </div>

  <div class="mood">
    ${moodEmojis[journal.mood] || '💭'} ${journal.mood.charAt(0).toUpperCase() + journal.mood.slice(1)}
  </div>

  ${journal.tags && journal.tags.length > 0 ? `
  <div class="tags">
    <strong>Tags:</strong><br>
    ${journal.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
  </div>
  ` : ''}

  <div class="content">
    <h2 style="margin-top: 0; color: #1f2937;">Journal Entry</h2>
    ${journal.entry}
  </div>

  ${insights ? `
  <div class="insights">
    <h2>AI Insights & Analysis</h2>
    
    ${insights.cbtInsights ? `
    <div class="insight-section">
      <h3>🧠 CBT Insights</h3>
      <p>${insights.cbtInsights}</p>
    </div>
    ` : ''}

    ${insights.emotions && insights.emotions.length > 0 ? `
    <div class="insight-section">
      <h3>💭 Detected Emotions</h3>
      <p>${insights.emotions.join(', ')}</p>
    </div>
    ` : ''}

    ${insights.positiveAspects && insights.positiveAspects.length > 0 ? `
    <div class="insight-section">
      <h3>✨ Positive Aspects</h3>
      ${insights.positiveAspects.map((aspect: string) => `<p>• ${aspect}</p>`).join('')}
    </div>
    ` : ''}

    ${insights.growthOpportunities && insights.growthOpportunities.length > 0 ? `
    <div class="insight-section">
      <h3>🌱 Growth Opportunities</h3>
      ${insights.growthOpportunities.map((opp: string) => `<p>• ${opp}</p>`).join('')}
    </div>
    ` : ''}

    ${insights.suggestions && insights.suggestions.length > 0 ? `
    <div class="insight-section">
      <h3>💡 Suggestions</h3>
      ${insights.suggestions.map((sugg: string) => `<p>• ${sugg}</p>`).join('')}
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <p>Exported from Manthan - Your Personal Journaling Companion</p>
    <p>This journal entry is private and confidential.</p>
  </div>
</body>
</html>
    `.trim();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="manthan-${journal.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'journal'}-${date.toISOString().split('T')[0]}.html"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating export:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate export' },
      { status: 500 }
    );
  }
}
